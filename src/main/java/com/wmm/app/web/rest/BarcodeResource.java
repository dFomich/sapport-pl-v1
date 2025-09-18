package com.wmm.app.web.rest;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.oned.Code128Writer;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/barcode")
public class BarcodeResource {

    @GetMapping(produces = MediaType.IMAGE_PNG_VALUE)
    public void generateBarcode(@RequestParam("code") String code, HttpServletResponse response) {
        System.out.println("Генерация штрих-кода для: " + code);

        try {
            Code128Writer barcodeWriter = new Code128Writer();
            BitMatrix bitMatrix = barcodeWriter.encode(code, BarcodeFormat.CODE_128, 300, 100);

            response.setContentType(MediaType.IMAGE_PNG_VALUE);
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", response.getOutputStream());
        } catch (Exception e) {
            try {
                response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Ошибка при генерации штрих-кода");
            } catch (IOException ignored) {}
        }
    }
}
