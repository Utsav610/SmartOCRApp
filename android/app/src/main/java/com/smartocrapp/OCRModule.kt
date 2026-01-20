package com.smartocrapp

import android.graphics.BitmapFactory
import android.util.Log
import com.facebook.react.bridge.*
import java.io.File

class OCRModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    private val detector = SevenSegmentTFLiteDetector(reactContext)

    override fun getName(): String = "OCRModule"

    override fun onCatalystInstanceDestroy() {
        detector.close()
        super.onCatalystInstanceDestroy()
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
                promise.reject("FILE_NOT_FOUND", "Image file not found at $cleanPath")
                return
            }

            // Decode file to Bitmap
            val bitmap = BitmapFactory.decodeFile(file.absolutePath)
            if (bitmap == null) {
                promise.reject("DECODE_ERROR", "Failed to decode image at $cleanPath")
                return
            }

            detector.detectDigitsAsync(
                bitmap,
                onSuccess = { resultString ->
                    try {
                        val resultMap = Arguments.createMap()
                        
                        // Parse the result string to double, defaulting to 0.0 if empty or invalid
                        val numericValue = resultString.toDoubleOrNull() ?: 0.0
                        
                        resultMap.putDouble("value", numericValue)
                        // Enhanced detector doesn't return a single confidence score in the callback,
                        // but we assume high confidence if it returned a result.
                        resultMap.putDouble("confidence", if (resultString.isNotEmpty()) 0.9 else 0.0)
                        resultMap.putString("rawText", resultString)

                        Log.d("OCRModule", "Success: $resultString")
                        promise.resolve(resultMap)
                    } catch (e: Exception) {
                        promise.reject("PARSE_ERROR", "Error parsing results: ${e.message}")
                    } finally {
                        // Clean up the original bitmap
                        if (!bitmap.isRecycled) {
                            bitmap.recycle()
                        }
                    }
                },
                onFailure = { e ->
                    Log.e("OCRModule", "Detection failed", e)
                    if (!bitmap.isRecycled) {
                        bitmap.recycle()
                    }
                    promise.reject("OCR_FAILED", e.message, e)
                }
            )

        } catch (e: Exception) {
            Log.e("OCRModule", "Unexpected error", e)
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
            croppedBitmap.compress(android.graphics.Bitmap.CompressFormat.JPEG, 90, outputStream)
            outputStream.close()

            promise.resolve("file://${outputFile.absolutePath}")

        } catch (e: Exception) {
            promise.reject("CROP_ERROR", e.message, e)
        }
    }
}
