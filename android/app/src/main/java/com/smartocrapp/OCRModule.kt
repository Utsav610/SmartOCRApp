package com.smartocrapp

import android.net.Uri
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

class OCRModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "OCRModule"
    }

    @ReactMethod
    fun scanMeasurement(imagePath: String?, promise: Promise) {
        if (imagePath == null) {
            promise.reject("INVALID_PATH", "Image path cannot be null")
            return
        }
        try {
            val file = File(imagePath.replace("file://", ""))
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "Image file not found at $imagePath")
                return
            }

            val image = InputImage.fromFilePath(reactApplicationContext, Uri.fromFile(file))
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val fullText = visionText.text
                    
                    // Simple logic to find a number in the text
                    // We'll look for strings that look like measurements (e.g., 12.345)
                    val numberRegex = "\\d+(\\.\\d+)?".toRegex()
                    val match = numberRegex.find(fullText)
                    val numericValue = match?.value?.toDoubleOrNull() ?: 0.0
                    
                    val result = Arguments.createMap()
                    result.putDouble("value", numericValue)
                    result.putDouble("confidence", 0.95) // Default confidence for now
                    result.putString("rawText", fullText)
                    
                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    promise.reject("OCR_FAILED", e.message, e)
                }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message, e)
        }
    }
}
