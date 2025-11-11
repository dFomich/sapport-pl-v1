package com.wmm.app.web.rest;

import com.wmm.app.domain.InventoryCurrent;
import com.wmm.app.domain.MechanicOrder;
import com.wmm.app.domain.MechanicOrderLine;
import com.wmm.app.repository.InventoryCurrentRepository;
import com.wmm.app.repository.InventoryVisiblePerStorageRepository;
import com.wmm.app.repository.MechanicOrderRepository;
import com.wmm.app.repository.MechanicTileRepository;
import com.wmm.app.service.InventoryVisiblePerStorageService;
import com.wmm.app.service.MechanicOrderService;
import com.wmm.app.service.TelegramBotService;
import com.wmm.app.service.dto.MechanicOrderLineDTO;
import com.wmm.app.web.rest.errors.BadRequestAlertException;
import jakarta.transaction.Transactional;
import java.io.ByteArrayOutputStream;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.telegram.telegrambots.meta.api.methods.send.SendMessage;

@RestController
@RequestMapping("/api/mechanic-orders")
public class MechanicOrderResource {

    @Autowired
    private TelegramBotService telegramBotService;

    private record CheckoutItem(String materialCode, Integer qty, Long tileId, String title) {}

    private record CheckoutRequest(String orderName, String storageType, List<CheckoutItem> items) {}

    private record CheckoutLine(String materialCode, String title, Integer qty) {}

    private record CheckoutResponse(
        Long orderId,
        String orderName,
        String storageType,
        String mechanicLogin,
        Instant createdAt,
        List<CheckoutLine> lines
    ) {}

    private final InventoryCurrentRepository invRepo;
    private final MechanicOrderRepository orderRepo;
    private final MechanicOrderService mechanicOrderService;
    private final MechanicTileRepository tileRepo;
    private final InventoryVisiblePerStorageService visiblePerStorageService;
    private final InventoryVisiblePerStorageRepository visiblePerStorageRepo;

    public MechanicOrderResource(
        InventoryCurrentRepository invRepo,
        MechanicOrderRepository orderRepo,
        MechanicOrderService mechanicOrderService,
        MechanicTileRepository tileRepo,
        InventoryVisiblePerStorageService visiblePerStorageService,
        InventoryVisiblePerStorageRepository visiblePerStorageRepo
    ) {
        this.invRepo = invRepo;
        this.orderRepo = orderRepo;
        this.mechanicOrderService = mechanicOrderService;
        this.tileRepo = tileRepo;
        this.visiblePerStorageService = visiblePerStorageService;
        this.visiblePerStorageRepo = visiblePerStorageRepo;
    }

    private String currentLogin() {
        return org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasAnyAuthority('ROLE_MECHANIC', 'ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<List<MechanicOrder>> getMyOrders() {
        String login = currentLogin();
        List<MechanicOrder> orders = orderRepo.findByMechanicLoginOrderByCreatedAtDesc(login);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<List<MechanicOrder>> getAllOrders(@RequestParam(name = "mechanic", required = false) String mechanicLogin) {
        List<MechanicOrder> orders;
        if (mechanicLogin != null && !mechanicLogin.isBlank()) {
            orders = orderRepo.findAllWithLinesByLogin(mechanicLogin.trim());
        } else {
            orders = orderRepo.findAllWithLines();
        }
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/warehouse/orders")
    @PreAuthorize("hasAnyAuthority('ROLE_WAREHOUSEMAN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<List<MechanicOrder>> getAllOrdersForWarehouse() {
        List<MechanicOrder> orders = orderRepo.findAllWithLines();
        return ResponseEntity.ok(orders);
    }

    @PutMapping("/{orderId}/complete")
    @PreAuthorize("hasAnyAuthority('ROLE_WAREHOUSEMAN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<Void> markAsCompleted(@PathVariable String orderId) {
        mechanicOrderService.markAsCompleted(orderId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{orderId}")
    @PreAuthorize("hasAnyAuthority('ROLE_MECHANIC', 'ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<?> getOrderLines(@PathVariable String orderId) {
        return orderRepo
            .findByOrderId(orderId)
            .map(order -> ResponseEntity.ok(Map.of("lines", order.getLines())))
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/cleanup")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @Transactional
    public ResponseEntity<Void> cleanupOldOrders() {
        Instant cutoff = Instant.now().minus(30, ChronoUnit.DAYS);
        orderRepo.deleteByCreatedAtBefore(cutoff);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    @PreAuthorize("hasAnyAuthority('ROLE_MECHANIC','ROLE_SENIOR_MECHANIC')")
    public ResponseEntity<CheckoutResponse> checkout(@RequestBody CheckoutRequest req) {
        if (req == null || req.items() == null || req.items().isEmpty()) {
            throw new BadRequestAlertException("Пустой заказ", "mechanicOrder", "empty");
        }

        // агрегируем по материалу
        Map<String, Integer> requested = new HashMap<>();
        Map<String, String> titles = new HashMap<>();
        for (CheckoutItem it : req.items()) {
            if (it.qty() == null || it.qty() <= 0) continue;
            requested.merge(it.materialCode(), it.qty(), Integer::sum);
            titles.putIfAbsent(it.materialCode(), Optional.ofNullable(it.title()).orElse(it.materialCode()));
        }

        if (requested.isEmpty()) {
            throw new BadRequestAlertException("Пустой заказ", "mechanicOrder", "empty");
        }

        // валидация по фактическим остаткам
        for (var e : requested.entrySet()) {
            var stock = invRepo
                .findByStorageTypeAndMaterial(req.storageType(), e.getKey())
                .map(InventoryCurrent::getAvailableStock)
                .orElse(0);
            if (e.getValue() > stock) {
                throw new BadRequestAlertException("Недостаточно на складе: " + e.getKey(), "mechanicOrder", "not_enough");
            }
        }

        // создаём заявку
        Long orderId = System.currentTimeMillis();
        String login = currentLogin();
        Instant now = Instant.now();

        List<CheckoutLine> lines = requested
            .entrySet()
            .stream()
            .map(e -> new CheckoutLine(e.getKey(), titles.getOrDefault(e.getKey(), e.getKey()), e.getValue()))
            .collect(Collectors.toList());

        MechanicOrder entity = new MechanicOrder();
        entity.setOrderId(req.orderName());
        entity.setMechanicLogin(login);
        entity.setStorageType(req.storageType());
        entity.setCreatedAt(now);
        entity.setCompleted(false);

        List<MechanicOrderLine> entityLines = lines
            .stream()
            .map(line -> {
                MechanicOrderLine l = new MechanicOrderLine();
                l.setMaterialCode(line.materialCode());
                l.setTitle(line.title());
                l.setQty(line.qty());
                l.setImageUrl(null);
                l.setOrder(entity);
                return l;
            })
            .toList();

        entity.setLines(entityLines);
        orderRepo.save(entity);

        for (var e : requested.entrySet()) {
            String material = e.getKey();

            // пересчитываем видимый остаток
            visiblePerStorageService.recalculate(req.storageType(), material);

            // уведомление по фактическому остатку
            invRepo
                .findByStorageTypeAndMaterial(req.storageType(), material)
                .ifPresent(ic -> {
                    String productTitle = titles.getOrDefault(ic.getMaterial(), ic.getMaterial());

                    if (ic.getAvailableStock() <= 0) {
                        // 🔴 товар закончился — уведомление на основе InventoryCurrent
                        telegramBotService.notifyOutOfStock(ic.getMaterial(), productTitle, req.storageType());
                    } else {
                        // 🟡 проверка по InventoryVisible — доступный остаток
                        tileRepo
                            .findByMaterialCodeAndActiveTrue(material)
                            .ifPresent(tile -> {
                                int minAlert = Optional.ofNullable(tile.getMinStockAlert()).orElse(0);
                                if (minAlert > 0) {
                                    // достаём видимый остаток
                                    visiblePerStorageRepo
                                        .findByStorageTypeAndMaterial(req.storageType(), material)
                                        .ifPresent(visible -> {
                                            int visibleStock = visible.getVisibleStock();
                                            if (visibleStock > 0 && visibleStock <= minAlert) {
                                                telegramBotService.notifyLowStock(
                                                    material,
                                                    productTitle,
                                                    visibleStock,
                                                    minAlert,
                                                    req.storageType()
                                                );
                                            }
                                        });
                                }
                            });
                    }
                });
        }

        return ResponseEntity.ok(new CheckoutResponse(orderId, req.orderName(), req.storageType(), login, now, lines));
    }

    @PutMapping("/{orderId}/lines")
    @PreAuthorize("hasAnyAuthority('ROLE_WAREHOUSEMAN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<Void> updateOrderLines(@PathVariable String orderId, @RequestBody List<MechanicOrderLineDTO> lines) {
        mechanicOrderService.updateOrderLines(orderId, lines);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{orderId}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_WAREHOUSEMAN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<Void> cancelOrder(@PathVariable String orderId) {
        mechanicOrderService.cancelOrder(orderId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{orderId}/update-line")
    @PreAuthorize("hasAnyAuthority('ROLE_WAREHOUSEMAN', 'ROLE_SENIOR_WAREHOUSEMAN')")
    public ResponseEntity<Void> updateOrderLine(
        @PathVariable String orderId,
        @RequestParam String material,
        @RequestParam(required = false) Integer newQty
    ) {
        mechanicOrderService.updateLineQtyOrDelete(orderId, material, newQty);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportOrders(@RequestParam String from, @RequestParam String to) {
        try {
            Instant fromDate = Instant.parse(from);
            Instant toDate = Instant.parse(to).plus(1, ChronoUnit.DAYS);

            List<MechanicOrder> orders = orderRepo.findOrdersInRangeWithLines(fromDate, toDate);

            Workbook workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Заявки");

            // === СТИЛИ ===
            // Заголовок таблицы
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Заголовок заявки
            CellStyle orderHeaderStyle = workbook.createCellStyle();
            Font orderFont = workbook.createFont();
            orderFont.setBold(true);
            orderHeaderStyle.setFont(orderFont);
            orderHeaderStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            orderHeaderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            orderHeaderStyle.setBorderBottom(BorderStyle.THIN);
            orderHeaderStyle.setBorderTop(BorderStyle.THIN);
            orderHeaderStyle.setBorderLeft(BorderStyle.THIN);
            orderHeaderStyle.setBorderRight(BorderStyle.THIN);
            orderHeaderStyle.setAlignment(HorizontalAlignment.CENTER);

            // Чередующиеся фоны заказов
            CellStyle lightOrderStyle = workbook.createCellStyle();
            lightOrderStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            lightOrderStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            CellStyle whiteOrderStyle = workbook.createCellStyle();
            // без заливки

            // Дата
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.createDataFormat().getFormat("dd.MM.yyyy HH:mm"));

            // === ЗАГОЛОВОК ===
            Row headerRow = sheet.createRow(0);
            String[] headers = { "Заявка", "Механик", "Дата создания", "Код товара", "Название", "Склад", "Кол-во", "Статус" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // === ДАННЫЕ ===
            int rowNum = 1;
            for (int orderIndex = 0; orderIndex < orders.size(); orderIndex++) {
                MechanicOrder order = orders.get(orderIndex);
                boolean isEvenOrder = (orderIndex % 2 == 0);
                CellStyle rowStyle = isEvenOrder ? whiteOrderStyle : lightOrderStyle;

                for (int lineIndex = 0; lineIndex < order.getLines().size(); lineIndex++) {
                    MechanicOrderLine line = order.getLines().get(lineIndex);
                    Row row = sheet.createRow(rowNum++);

                    // Заявка
                    Cell cellOrderId = row.createCell(0);
                    if (lineIndex == 0) {
                        cellOrderId.setCellValue(order.getOrderId());
                        cellOrderId.setCellStyle(orderHeaderStyle);
                    } else {
                        cellOrderId.setCellValue("");
                        cellOrderId.setCellStyle(rowStyle);
                    }

                    // Механик
                    Cell cellMechanic = row.createCell(1);
                    if (lineIndex == 0) {
                        cellMechanic.setCellValue(order.getMechanicLogin());
                        cellMechanic.setCellStyle(orderHeaderStyle);
                    } else {
                        cellMechanic.setCellValue("");
                        cellMechanic.setCellStyle(rowStyle);
                    }

                    // Дата
                    Cell cellDate = row.createCell(2);
                    if (lineIndex == 0) {
                        cellDate.setCellValue(Date.from(order.getCreatedAt()));
                        CellStyle dateCellStyle = workbook.createCellStyle();
                        dateCellStyle.cloneStyleFrom(orderHeaderStyle);
                        dateCellStyle.setDataFormat(workbook.createDataFormat().getFormat("dd.MM.yyyy HH:mm"));
                        cellDate.setCellStyle(dateCellStyle);
                    } else {
                        cellDate.setCellValue("");
                        cellDate.setCellStyle(rowStyle);
                    }

                    // Код товара
                    Cell cellCode = row.createCell(3);
                    cellCode.setCellValue(line.getMaterialCode());
                    cellCode.setCellStyle(rowStyle);

                    // Название
                    Cell cellTitle = row.createCell(4);
                    cellTitle.setCellValue(line.getTitle());
                    cellTitle.setCellStyle(rowStyle);

                    // Склад
                    Cell cellStorage = row.createCell(5);
                    cellStorage.setCellValue(order.getStorageType());
                    cellStorage.setCellStyle(rowStyle);

                    // Количество
                    Cell cellQty = row.createCell(6);
                    cellQty.setCellValue(line.getQty());
                    cellQty.setCellStyle(rowStyle);

                    // Статус
                    Cell cellStatus = row.createCell(7);
                    String status = order.isCancelled() ? "Отменена" : order.isCompleted() ? "Выдана" : "В процессе";
                    cellStatus.setCellValue(status);
                    cellStatus.setCellStyle(rowStyle);
                }

                // === Разделительная пустая строка между заказами ===
                rowNum++;
            }

            // === ГРАНИЦЫ ДЛЯ ВСЕХ ЯЧЕЕК ===
            for (int i = 0; i < sheet.getPhysicalNumberOfRows(); i++) {
                Row row = sheet.getRow(i);
                if (row != null) {
                    for (int j = 0; j < headers.length; j++) {
                        Cell cell = row.getCell(j);
                        if (cell != null) {
                            CellStyle borderedStyle = workbook.createCellStyle();
                            borderedStyle.cloneStyleFrom(cell.getCellStyle());
                            borderedStyle.setBorderBottom(BorderStyle.THIN);
                            borderedStyle.setBorderTop(BorderStyle.THIN);
                            borderedStyle.setBorderLeft(BorderStyle.THIN);
                            borderedStyle.setBorderRight(BorderStyle.THIN);
                            cell.setCellStyle(borderedStyle);
                        }
                    }
                }
            }

            // === АВТОШИРИНА КОЛОНОК ===
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                sheet.setColumnWidth(i, sheet.getColumnWidth(i) + 512);
            }

            // === СОХРАНЕНИЕ ===
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            workbook.close();

            HttpHeaders headersHttp = new HttpHeaders();
            headersHttp.add("Content-Disposition", "attachment; filename=orders_export.xlsx");

            return ResponseEntity.ok()
                .headers(headersHttp)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(outputStream.toByteArray());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }
}
