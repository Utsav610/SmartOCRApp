package com.smartocrapp

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.Paint
import android.util.Log
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.Text
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.TextRecognizer
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Enhanced Display Detector using Google ML Kit
 * Optimized for various LCD and seven-segment displays
 */
class SevenSegmentTFLiteDetector(context: Context) {

    private val textRecognizer: TextRecognizer = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS)

    init {
        Log.d(TAG, "Enhanced ML Kit Detector initialized")
    }

    fun detectDigit(bitmap: Bitmap): Pair<String?, Float>? = null

    fun detectMultipleDigits(
        bitmap: Bitmap,
        minDigits: Int = 2,
        maxDigits: Int = 10,
        confidenceThreshold: Float = 0.5f
    ): String = ""

    /**
     * Main async detection with comprehensive preprocessing
     */
    fun detectDigitsAsync(
        bitmap: Bitmap,
        onSuccess: (String) -> Unit,
        onFailure: (Exception) -> Unit
    ) {
        Log.d(TAG, "=== Starting Enhanced Detection ===")
        Log.d(TAG, "Input image: ${bitmap.width}x${bitmap.height}")

        // Generate all preprocessing variations
        val processedImages = generatePreprocessedImages(bitmap)
        Log.d(TAG, "Generated ${processedImages.size} preprocessing variations")

        val allResults = mutableListOf<DetectionResult>()
        var completedCount = 0

        for ((index, processed) in processedImages.withIndex()) {
            val inputImage = InputImage.fromBitmap(processed.bitmap, 0)

            textRecognizer.process(inputImage)
                .addOnSuccessListener { visionText ->
                    val extracted = extractFromVisionText(visionText, processed.name)
                    if (extracted != null) {
                        allResults.add(extracted)
                    }

                    completedCount++
                    checkCompletion(completedCount, processedImages.size, allResults, processedImages, bitmap, onSuccess)
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Preprocessing ${processed.name} failed: ${e.message}")
                    completedCount++
                    checkCompletion(completedCount, processedImages.size, allResults, processedImages, bitmap, onSuccess)
                }
        }
    }

    private fun checkCompletion(
        completed: Int,
        total: Int,
        results: List<DetectionResult>,
        processedImages: List<ProcessedImage>,
        originalBitmap: Bitmap,
        onSuccess: (String) -> Unit
    ) {
        if (completed >= total) {
            // Cleanup processed images
            processedImages.forEach { 
                if (it.bitmap != originalBitmap) {
                    it.bitmap.recycle()
                }
            }

            // Select best result
            val bestResult = selectBestResult(results)
            Log.d(TAG, "=== Final Result: '$bestResult' ===")
            onSuccess(bestResult)
        }
    }

    /**
     * Generate multiple preprocessed versions of the image
     */
    private fun generatePreprocessedImages(bitmap: Bitmap): List<ProcessedImage> {
        val images = mutableListOf<ProcessedImage>()

        // 1. Original
        images.add(ProcessedImage("original", bitmap))

        // 2-4. Different contrast levels
        for (contrast in listOf(1.3f, 1.8f, 2.5f)) {
            images.add(ProcessedImage("contrast_$contrast", enhanceContrast(bitmap, contrast)))
        }

        // 5. Grayscale high contrast
        images.add(ProcessedImage("grayscale_hc", toGrayscaleHighContrast(bitmap)))

        // 6. Inverted colors
        images.add(ProcessedImage("inverted", invertColors(bitmap)))

        // 7. Inverted + high contrast
        images.add(ProcessedImage("inverted_hc", enhanceContrast(invertColors(bitmap), 1.5f)))

        // 8-10. Different threshold levels
        for (threshold in listOf(0.4f, 0.5f, 0.6f)) {
            images.add(ProcessedImage("threshold_$threshold", adaptiveThreshold(bitmap, threshold)))
        }

        // 11. Inverted threshold
        images.add(ProcessedImage("inverted_threshold", adaptiveThreshold(invertColors(bitmap), 0.5f)))

        // 12-14. Scaled versions (sometimes helps with small text)
        for (scale in listOf(1.5f, 2.0f, 0.75f)) {
            val scaled = Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * scale).toInt(),
                (bitmap.height * scale).toInt(),
                true
            )
            images.add(ProcessedImage("scaled_$scale", scaled))
        }

        // 15. Green channel extraction (for green displays)
        images.add(ProcessedImage("green_channel", extractColorChannel(bitmap, ColorChannel.GREEN)))

        // 16. Red channel (for some displays)
        images.add(ProcessedImage("red_channel", extractColorChannel(bitmap, ColorChannel.RED)))

        // 17. Blue channel
        images.add(ProcessedImage("blue_channel", extractColorChannel(bitmap, ColorChannel.BLUE)))

        // 18. Saturation boost (helps colored displays)
        images.add(ProcessedImage("saturated", adjustSaturation(bitmap, 2.0f)))

        // 19. Desaturated + contrast
        images.add(ProcessedImage("desaturated", adjustSaturation(bitmap, 0f)))

        return images
    }

    /**
     * Extract numeric value from ML Kit result
     */
    private fun extractFromVisionText(visionText: Text, preprocessName: String): DetectionResult? {
        val fullText = visionText.text
        if (fullText.isBlank()) return null

        Log.d(TAG, "[$preprocessName] Raw: '$fullText'")

        // Clean and extract number
        val cleaned = cleanOcrText(fullText)
        val number = extractNumber(cleaned)

        if (number.isNotEmpty()) {
            // Calculate confidence based on how "number-like" the result is
            val confidence = calculateConfidence(number, visionText)
            Log.d(TAG, "[$preprocessName] Extracted: '$number' (confidence: $confidence)")
            return DetectionResult(number, confidence, preprocessName)
        }

        return null
    }

    /**
     * Clean OCR text - fix common misreadings
     */
    private fun cleanOcrText(text: String): String {
        return text
            // Letter to digit substitutions
            .replace("O", "0").replace("o", "0")
            .replace("l", "1").replace("I", "1").replace("|", "1")
            .replace("S", "5").replace("s", "5")
            .replace("B", "8")
            .replace("Z", "2").replace("z", "2")
            .replace("G", "6").replace("g", "9")
            .replace("A", "4").replace("a", "4")
            .replace("T", "7").replace("t", "7")
            .replace("b", "6").replace("D", "0")
            .replace("q", "9").replace("Q", "0")
            .replace("E", "8").replace("e", "8")
            // Decimal point variations
            .replace(",", ".").replace("·", ".")
            .replace("'", ".").replace("`", ".")
            .replace(":", ".").replace(";", ".")
            .replace("°", ".").replace("*", ".")
            // Remove noise
            .replace(" ", "").replace("\n", "")
            .replace("-", "").replace("_", "")
            .replace("mm", "").replace("MM", "")
            .replace("m", "").replace("M", "")
            .replace("in", "").replace("IN", "")
    }

    /**
     * Extract numeric pattern from cleaned text
     */
    private fun extractNumber(text: String): String {
        // Find all number-like patterns
        val patterns = listOf(
            Regex("[0-9]+\\.[0-9]+"),      // Standard decimal (10.28)
            Regex("[0-9]+\\.[0-9]"),        // Single decimal place (12.0)
            Regex("[0-9]\\.[0-9]+"),        // Single digit before decimal
            Regex("[0-9]{2,5}")             // Just digits (will infer decimal)
        )

        for (pattern in patterns) {
            val match = pattern.find(text)
            if (match != null) {
                return match.value
            }
        }

        // Fallback: extract any digits
        val digits = text.filter { it.isDigit() || it == '.' }
        return if (digits.count { it == '.' } <= 1) digits else digits.replace(".", "")
    }

    /**
     * Calculate confidence score for a result
     */
    private fun calculateConfidence(number: String, visionText: Text): Float {
        var confidence = 0.5f

        // Has decimal point = higher confidence
        if (number.contains(".")) {
            confidence += 0.2f
        }

        // Reasonable length for measurement (2-6 chars)
        if (number.length in 2..6) {
            confidence += 0.1f
        }

        // Check if value is in reasonable range for thickness (0.1 - 999.9)
        try {
            val value = number.toFloat()
            if (value in 0.1f..999.9f) {
                confidence += 0.15f
            }
        } catch (e: Exception) { }

        // More text blocks found = more reliable
        if (visionText.textBlocks.isNotEmpty()) {
            confidence += 0.05f * min(visionText.textBlocks.size, 3)
        }

        return min(confidence, 1.0f)
    }

    /**
     * Select best result from all detection attempts
     */
    private fun selectBestResult(results: List<DetectionResult>): String {
        if (results.isEmpty()) return ""

        Log.d(TAG, "--- Selecting from ${results.size} results ---")
        results.forEach { Log.d(TAG, "  ${it.preprocessName}: '${it.value}' (${it.confidence})") }

        // Group similar results
        val grouped = results.groupBy { normalizeNumber(it.value) }
        
        // Find the most common result (with highest total confidence)
        val best = grouped.maxByOrNull { group ->
            group.value.sumOf { it.confidence.toDouble() } * group.value.size
        }

        if (best != null && best.value.isNotEmpty()) {
            // Return the version with decimal if available
            val withDecimal = best.value.find { it.value.contains(".") }
            if (withDecimal != null) {
                return withDecimal.value
            }

            // Otherwise infer decimal position
            val mostConfident = best.value.maxByOrNull { it.confidence }
            if (mostConfident != null) {
                return inferDecimalIfNeeded(mostConfident.value)
            }
        }

        // Fallback: return highest confidence single result
        val highest = results.maxByOrNull { it.confidence }
        return if (highest != null) inferDecimalIfNeeded(highest.value) else ""
    }

    /**
     * Normalize number for comparison (remove decimal point)
     */
    private fun normalizeNumber(number: String): String {
        return number.replace(".", "")
    }

    /**
     * Infer decimal position if not present
     */
    private fun inferDecimalIfNeeded(value: String): String {
        if (value.contains(".")) return value

        return when (value.length) {
            4 -> "${value.substring(0, 2)}.${value.substring(2)}"  // 1028 -> 10.28
            3 -> "${value.substring(0, 2)}.${value.substring(2)}"  // 120 -> 12.0
            5 -> "${value.substring(0, 3)}.${value.substring(3)}"  // 11278 -> 112.78
            2 -> "${value[0]}.${value[1]}"                          // 12 -> 1.2
            else -> value
        }
    }

    // ============ Image Processing Functions ============

    private fun enhanceContrast(bitmap: Bitmap, contrast: Float): Bitmap {
        val result = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)
        val paint = Paint()

        val translate = (-.5f * contrast + .5f) * 255f
        val cm = ColorMatrix(floatArrayOf(
            contrast, 0f, 0f, 0f, translate,
            0f, contrast, 0f, 0f, translate,
            0f, 0f, contrast, 0f, translate,
            0f, 0f, 0f, 1f, 0f
        ))

        paint.colorFilter = ColorMatrixColorFilter(cm)
        canvas.drawBitmap(bitmap, 0f, 0f, paint)
        return result
    }

    private fun toGrayscaleHighContrast(bitmap: Bitmap): Bitmap {
        val result = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)
        val paint = Paint()

        val grayscale = ColorMatrix()
        grayscale.setSaturation(0f)

        val contrast = 2.0f
        val translate = (-.5f * contrast + .5f) * 255f
        val contrastMatrix = ColorMatrix(floatArrayOf(
            contrast, 0f, 0f, 0f, translate,
            0f, contrast, 0f, 0f, translate,
            0f, 0f, contrast, 0f, translate,
            0f, 0f, 0f, 1f, 0f
        ))

        grayscale.postConcat(contrastMatrix)
        paint.colorFilter = ColorMatrixColorFilter(grayscale)
        canvas.drawBitmap(bitmap, 0f, 0f, paint)
        return result
    }

    private fun invertColors(bitmap: Bitmap): Bitmap {
        val result = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)
        val paint = Paint()

        val cm = ColorMatrix(floatArrayOf(
            -1f, 0f, 0f, 0f, 255f,
            0f, -1f, 0f, 0f, 255f,
            0f, 0f, -1f, 0f, 255f,
            0f, 0f, 0f, 1f, 0f
        ))

        paint.colorFilter = ColorMatrixColorFilter(cm)
        canvas.drawBitmap(bitmap, 0f, 0f, paint)
        return result
    }

    private fun adaptiveThreshold(bitmap: Bitmap, thresholdPercent: Float = 0.5f): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

        val pixels = IntArray(width * height)
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

        // Calculate luminance and find min/max
        val luminance = IntArray(width * height)
        var minLum = 255
        var maxLum = 0

        for (i in pixels.indices) {
            val pixel = pixels[i]
            val lum = (Color.red(pixel) * 0.299 + Color.green(pixel) * 0.587 + Color.blue(pixel) * 0.114).toInt()
            luminance[i] = lum
            minLum = min(minLum, lum)
            maxLum = max(maxLum, lum)
        }

        // Calculate threshold
        val threshold = minLum + ((maxLum - minLum) * thresholdPercent).toInt()

        // Apply threshold
        val resultPixels = IntArray(width * height)
        for (i in luminance.indices) {
            resultPixels[i] = if (luminance[i] < threshold) Color.BLACK else Color.WHITE
        }

        result.setPixels(resultPixels, 0, width, 0, 0, width, height)
        return result
    }

    enum class ColorChannel { RED, GREEN, BLUE }

    private fun extractColorChannel(bitmap: Bitmap, channel: ColorChannel): Bitmap {
        val width = bitmap.width
        val height = bitmap.height
        val result = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)

        val pixels = IntArray(width * height)
        bitmap.getPixels(pixels, 0, width, 0, 0, width, height)

        val resultPixels = IntArray(width * height)
        for (i in pixels.indices) {
            val pixel = pixels[i]
            val value = when (channel) {
                ColorChannel.RED -> Color.red(pixel)
                ColorChannel.GREEN -> Color.green(pixel)
                ColorChannel.BLUE -> Color.blue(pixel)
            }
            // Create grayscale from single channel
            resultPixels[i] = Color.rgb(value, value, value)
        }

        result.setPixels(resultPixels, 0, width, 0, 0, width, height)
        return result
    }

    private fun adjustSaturation(bitmap: Bitmap, saturation: Float): Bitmap {
        val result = Bitmap.createBitmap(bitmap.width, bitmap.height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(result)
        val paint = Paint()

        val cm = ColorMatrix()
        cm.setSaturation(saturation)

        paint.colorFilter = ColorMatrixColorFilter(cm)
        canvas.drawBitmap(bitmap, 0f, 0f, paint)
        return result
    }

    fun close() {
        textRecognizer.close()
        Log.d(TAG, "Detector closed")
    }

    // Data classes
    private data class ProcessedImage(val name: String, val bitmap: Bitmap)
    private data class DetectionResult(val value: String, val confidence: Float, val preprocessName: String)

    companion object {
        private const val TAG = "DisplayDetector"
    }
}
