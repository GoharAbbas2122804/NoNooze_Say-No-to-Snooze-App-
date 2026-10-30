package com.nonooze.wakevision

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import org.tensorflow.lite.Interpreter
import java.nio.ByteBuffer
import java.nio.ByteOrder

class EyeCropProcessor(context: Context) {
    private val inputBuffer = ByteBuffer.allocateDirect(48 * 48 * 4).order(ByteOrder.nativeOrder())
    private val outputArray = Array(1) { FloatArray(1) }
    private val interpreter: Interpreter

    init {
        val modelBytes = context.assets.open("eye_cnn_v1.tflite").use { it.readBytes() }
        val model = ByteBuffer.allocateDirect(modelBytes.size).order(ByteOrder.nativeOrder()).apply {
            put(modelBytes)
            rewind()
        }
        interpreter = Interpreter(model, Interpreter.Options().apply { setNumThreads(2) })
    }

    fun processEye(bitmap: Bitmap, centerX: Float, centerY: Float, faceWidth: Float, faceHeight: Float): Float {
        val cropWidth = (faceWidth * 0.18f).toInt().coerceAtLeast(1)
        val cropHeight = (faceHeight * 0.14f).toInt().coerceAtLeast(1)
        val left = (centerX - cropWidth / 2).toInt().coerceIn(0, bitmap.width - 1)
        val top = (centerY - cropHeight / 2).toInt().coerceIn(0, bitmap.height - 1)
        val width = cropWidth.coerceAtMost(bitmap.width - left)
        val height = cropHeight.coerceAtMost(bitmap.height - top)
        val scaled = Bitmap.createScaledBitmap(Bitmap.createBitmap(bitmap, left, top, width, height), 48, 48, true)

        inputBuffer.rewind()
        for (y in 0 until 48) {
            for (x in 0 until 48) {
                val pixel = scaled.getPixel(x, y)
                inputBuffer.putFloat((0.299f * Color.red(pixel) + 0.587f * Color.green(pixel) + 0.114f * Color.blue(pixel)) / 255f)
            }
        }
        interpreter.run(inputBuffer, outputArray)
        return outputArray[0][0].coerceIn(0f, 1f)
    }

    fun close() = interpreter.close()
}
