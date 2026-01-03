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
            val cleanPath = imagePath.replace("file://", "")
            val file = File(cleanPath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "Image file not found at $imagePath")
                return
            }

            // 1. Get Image Dimensions and Rotation
            val options = android.graphics.BitmapFactory.Options()
            options.inJustDecodeBounds = true
            android.graphics.BitmapFactory.decodeFile(cleanPath, options)
            val width = options.outWidth
            val height = options.outHeight

            val exif = android.media.ExifInterface(cleanPath)
            val orientation = exif.getAttributeInt(
                android.media.ExifInterface.TAG_ORIENTATION,
                android.media.ExifInterface.ORIENTATION_NORMAL
            )
            
            val rotationDegrees = when (orientation) {
                android.media.ExifInterface.ORIENTATION_ROTATE_90 -> 90
                android.media.ExifInterface.ORIENTATION_ROTATE_180 -> 180
                android.media.ExifInterface.ORIENTATION_ROTATE_270 -> 270
                else -> 0
            }

            // 2. Define ROI (Center 50%)
            // We crop the center 50% of the text.
            // Since we want "half width and half height", we take the middle half.
            val cropWidth = width / 2
            val cropHeight = height / 2
            val startX = (width - cropWidth) / 2
            val startY = (height - cropHeight) / 2
            
            val rect = android.graphics.Rect(startX, startY, startX + cropWidth, startY + cropHeight)

            // 3. Decode Region
            val inputStream = java.io.FileInputStream(cleanPath)
            val decoder = android.graphics.BitmapRegionDecoder.newInstance(inputStream, false)
            val croppedBitmap = decoder?.decodeRegion(rect, null)
            inputStream.close()

            if (croppedBitmap == null) {
                 promise.reject("DECODE_ERROR", "Failed to decode image region")
                 return
            }

            // 4. Process with MLKit
            // We must pass the rotation metadata because we cropped the raw image.
            val image = InputImage.fromBitmap(croppedBitmap, rotationDegrees)
            val recognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

            recognizer.process(image)
                .addOnSuccessListener { visionText ->
                    val fullText = visionText.text
                    
                    // Regex to find numbers, supporting decimals with dot or comma, and optional spaces.
                    // Examples: 3.14, 3,14, 3 . 14, 0.5, .5
                    val numberRegex = "(\\d+\\s*[.,]\\s*\\d+|\\d+|\\s*[.,]\\s*\\d+)".toRegex()
                    
                    val match = numberRegex.find(fullText)
                    var numericValue = 0.0
                    
                    if (match != null) {
                        // Normalize: remove spaces, replace comma with dot
                        val normalized = match.value.replace(" ", "").replace(",", ".")
                        numericValue = normalized.toDoubleOrNull() ?: 0.0
                    }
                    
                    val result = Arguments.createMap()
                    result.putDouble("value", numericValue)
                    // MLKit doesn't give overall confidence easily in 'text' object, 
                    // typically we'd iterate blocks/lines. For simplicity we assume good confidence if we found a number.
                    result.putDouble("confidence", if (match != null) 0.9 else 0.0) 
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
