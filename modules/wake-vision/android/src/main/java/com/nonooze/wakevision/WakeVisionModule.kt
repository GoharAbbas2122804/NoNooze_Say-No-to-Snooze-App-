package com.nonooze.wakevision

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Matrix
import android.util.Base64
import android.os.SystemClock
import android.util.Log
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.face.FaceLandmark
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.TimeUnit

class WakeVisionModule : Module() {
    private var processor: EyeCropProcessor? = null
    private var detector: FaceDetector? = null

    override fun definition() = ModuleDefinition {
        Name("WakeVision")

        OnCreate {
            val ctx = appContext.reactContext ?: return@OnCreate
            try {
                processor = EyeCropProcessor(ctx)
            } catch (error: Exception) {
                Log.e("WakeVision", "Eye model initialization failed", error)
            }
            try {
                detector = FaceDetection.getClient(
                    FaceDetectorOptions.Builder()
                        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
                        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                        .enableTracking()
                        .build()
                )
            } catch (error: Exception) {
                Log.e("WakeVision", "Face detector initialization failed", error)
            }
        }

        OnDestroy {
            processor?.close()
            processor = null
            detector?.close()
            detector = null
        }

        Function("isAvailable") {
            return@Function detector != null
        }

        AsyncFunction("analyzeGrayFrame") { base64: String, width: Int, height: Int, orientation: String ->
            val faceDetector = detector ?: throw IllegalStateException("Face detector did not load")
            require(width > 0 && height > 0) { "Invalid camera frame size" }

            val startedAt = SystemClock.elapsedRealtime()
            val gray = Base64.decode(base64, Base64.DEFAULT)
            require(gray.size == width * height) { "Invalid grayscale camera frame" }
            val colors = IntArray(gray.size) { index ->
                val value = gray[index].toInt() and 0xff
                Color.rgb(value, value, value)
            }
            val rawBitmap = Bitmap.createBitmap(colors, width, height, Bitmap.Config.ARGB_8888)
            val rotation = when (orientation) {
                "right" -> 90f
                "down" -> 180f
                "left" -> 270f
                else -> 0f
            }
            val bitmap = if (rotation == 0f) rawBitmap else Bitmap.createBitmap(
                rawBitmap, 0, 0, width, height, Matrix().apply { postRotate(rotation) }, true
            )
            val faces = Tasks.await(faceDetector.process(InputImage.fromBitmap(bitmap, 0)), 2500, TimeUnit.MILLISECONDS)
            val brightness = gray.map { (it.toInt() and 0xff) }.average() / 255.0
            val face = faces.maxByOrNull { it.boundingBox.width() * it.boundingBox.height() }

            if (face == null) {
                return@AsyncFunction mapOf(
                    "faceFound" to false,
                    "brightness" to brightness,
                    "latencyMs" to (SystemClock.elapsedRealtime() - startedAt).toDouble()
                )
            }

            val box = face.boundingBox
            val leftEye = face.getLandmark(FaceLandmark.LEFT_EYE)?.position
            val rightEye = face.getLandmark(FaceLandmark.RIGHT_EYE)?.position
            val leftMl = face.leftEyeOpenProbability?.toDouble()
            val rightMl = face.rightEyeOpenProbability?.toDouble()
            val model = processor
            val leftCnn = if (model != null) leftEye?.let { model.processEye(bitmap, it.x, it.y, box.width().toFloat(), box.height().toFloat()).toDouble() } else null
            val rightCnn = if (model != null) rightEye?.let { model.processEye(bitmap, it.x, it.y, box.width().toFloat(), box.height().toFloat()).toDouble() } else null

            return@AsyncFunction mapOf(
                "faceFound" to true,
                "leftEyeOpen" to leftMl,
                "rightEyeOpen" to rightMl,
                "leftEyeCnn" to leftCnn,
                "rightEyeCnn" to rightCnn,
                "yaw" to face.headEulerAngleY.toDouble(),
                "pitch" to face.headEulerAngleX.toDouble(),
                "roll" to face.headEulerAngleZ.toDouble(),
                "upright" to if (kotlin.math.abs(face.headEulerAngleX) < 25 && kotlin.math.abs(face.headEulerAngleZ) < 25) 1.0 else 0.0,
                "brightness" to brightness,
                "faceBox" to mapOf(
                    "x" to box.left.toDouble() / bitmap.width,
                    "y" to box.top.toDouble() / bitmap.height,
                    "w" to box.width().toDouble() / bitmap.width,
                    "h" to box.height().toDouble() / bitmap.height
                ),
                "latencyMs" to (SystemClock.elapsedRealtime() - startedAt).toDouble()
            )
        }

        AsyncFunction("cropAndClassify") { base64: String, normX: Double, normY: Double, normW: Double, normH: Double ->
            val model = processor ?: throw IllegalStateException("Eye model did not load")
            val bytes = Base64.decode(base64, Base64.DEFAULT)
            val bitmap = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                ?: throw IllegalArgumentException("Invalid eye image")
            val startedAt = SystemClock.elapsedRealtime()
            val probability = model.processEye(
                bitmap,
                ((normX + normW / 2) * bitmap.width).toFloat(),
                ((normY + normH / 2) * bitmap.height).toFloat(),
                (normW * bitmap.width).toFloat(),
                (normH * bitmap.height).toFloat()
            )
            mapOf("probability" to probability.toDouble(), "latencyMs" to (SystemClock.elapsedRealtime() - startedAt).toDouble())
        }
    }
}
