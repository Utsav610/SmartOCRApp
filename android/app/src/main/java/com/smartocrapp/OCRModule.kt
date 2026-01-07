package com.smartocrapp

import android.net.Uri
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import java.io.File
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint

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

            // 2. Define ROI (Full Image)
            // Requirement changed: The input image is already cropped or we want to scan the full image.
            // We no longer apply a fixed 50% crop here.
            
            // 3. Decode Full Image
            val bitmap = android.graphics.BitmapFactory.decodeFile(cleanPath)

            if (bitmap == null) {
                 promise.reject("DECODE_ERROR", "Failed to decode image")
                 return
            }



            // 4. Process with MLKit
            // Enhance image for better contrast (helps with decimals and black font)
            val enhancedBitmap = enhanceBitmap(bitmap)

            // We must pass the rotation metadata because we cropped the raw image.
            val image = InputImage.fromBitmap(enhancedBitmap, rotationDegrees)
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

    @ReactMethod
    fun cropImage(imagePath: String?, x: Double, y: Double, width: Double, height: Double, promise: Promise) {
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

            // 1. Decode original dimensions to calculate scale if needed
            // But usually coordinates are passed relative to the image size.
            // CAUTION: React Native usually passes coordinates relative to the DISPLAYED size.
            // Ideally the JS side should pass coordinates relative to the ACTUAL image size,
            // or we need to know the displayed size.
            // Assumption: JS side calculates coordinates relative to the ACTUAL image size.

            val rect = android.graphics.Rect(x.toInt(), y.toInt(), (x + width).toInt(), (y + height).toInt())

            // 2. Decode Region
            val inputStream = java.io.FileInputStream(cleanPath)
            val decoder = android.graphics.BitmapRegionDecoder.newInstance(inputStream, false)
            val croppedBitmap = decoder?.decodeRegion(rect, null)
            inputStream.close()

            if (croppedBitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image region")
                return
            }

            // 3. Save to new temp file
            val cacheDir = reactApplicationContext.cacheDir
            val outputFile = File.createTempFile("crop_", ".jpg", cacheDir)
            val outputStream = java.io.FileOutputStream(outputFile)
            croppedBitmap.compress(Bitmap.CompressFormat.JPEG, 90, outputStream)
            outputStream.close()

            promise.resolve("file://${outputFile.absolutePath}")

        } catch (e: Exception) {
            promise.reject("CROP_ERROR", e.message, e)
        }
    }

    private fun enhanceBitmap(bitmap: Bitmap): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        val bmpGrayscale = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

        val c = Canvas(bmpGrayscale)
        val paint = Paint()

        // 1. Grayscale
        val cm = ColorMatrix()
        cm.setSaturation(0f)

        // 2. High Contrast
        // Scale factor: > 1 increases contrast. 1.5 - 2.0 is usually good for text.
        val contrast = 2.0f
        val offset = -128f * (contrast - 1f)
        
        val cmContrast = ColorMatrix(floatArrayOf(
            contrast, 0f, 0f, 0f, offset,
            0f, contrast, 0f, 0f, offset,
            0f, 0f, contrast, 0f, offset,
            0f, 0f, 0f, 1f, 0f
        ))
        
        cm.postConcat(cmContrast)

        val f = ColorMatrixColorFilter(cm)
        paint.colorFilter = f
        c.drawBitmap(bitmap, 0f, 0f, paint)

        return bmpGrayscale
    }
}
