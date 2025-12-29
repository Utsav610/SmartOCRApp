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
    fun scanText(imagePath: String?, promise: Promise) {
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
                    val result = Arguments.createMap()
                    result.putString("fullText", visionText.text)

                    val blocks = Arguments.createArray()
                    for (block in visionText.textBlocks) {
                        val blockMap = Arguments.createMap()
                        blockMap.putString("text", block.text)
                        blockMap.putDouble("confidence", block.lines.firstOrNull()?.elements?.firstOrNull()?.confidence?.toDouble() ?: 1.0)
                        
                        val rect = block.boundingBox
                        val rectMap = Arguments.createMap()
                        rectMap.putInt("x", rect?.left ?: 0)
                        rectMap.putInt("y", rect?.top ?: 0)
                        rectMap.putInt("width", rect?.width() ?: 0)
                        rectMap.putInt("height", rect?.height() ?: 0)
                        blockMap.putMap("boundingBox", rectMap)
                        
                        blocks.pushMap(blockMap)
                    }
                    result.putArray("blocks", blocks)
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
