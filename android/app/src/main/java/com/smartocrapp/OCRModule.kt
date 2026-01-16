package com.smartocrapp

import android.net.Uri
import android.util.Log
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File

class OCRModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "OCRModule"

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

            val image = InputImage.fromFilePath(
                reactApplicationContext,
                Uri.fromFile(file)
            )

            val recognizer =
                TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->

                    val fullText = visionText.text

                    Log.d("OCRModule", "OCR raw text:\n$fullText")

                    // Regex to extract numbers like 12 or 12.34
                    val numberRegex = "\\d+(\\.\\d+)?".toRegex()

                    val match = numberRegex.find(fullText)
                    val numericValue = match?.value?.toDoubleOrNull() ?: 0.0

                    Log.d(
                        "OCRModule",
                        "OCR extracted number: ${match?.value ?: "NONE"}"
                    )

                    val result = Arguments.createMap()
                    result.putDouble("value", numericValue)
                    result.putDouble("confidence", 0.95)
                    result.putString("rawText", fullText)

                    Log.d(
                        "OCRModule",
                        "OCR result map: value=$numericValue, confidence=0.95"
                    )

                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    Log.e("OCRModule", "OCR failed", e)
                    promise.reject("OCR_FAILED", e.message, e)
                }

        } catch (e: Exception) {
            Log.e("OCRModule", "Unexpected error", e)
            promise.reject("ERROR", e.message, e)
        }
    }
}
