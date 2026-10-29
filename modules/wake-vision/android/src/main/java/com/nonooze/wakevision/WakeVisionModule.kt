package com.nonooze.wakevision

import android.graphics.BitmapFactory
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class WakeVisionModule : Module() {
    private var processor: EyeCropProcessor? = null

    override fun definition() = ModuleDefinition {
        Name("WakeVision")

        OnCreate {
            val ctx = appContext.reactContext ?: return@OnCreate
            processor = EyeCropProcessor(ctx)
        }

        OnDestroy {
            processor?.close()
            processor = null
        }

        Function("isAvailable") {
            return@Function true
        }

        AsyncFunction("cropAndClassify") { base64Data: String, normX: Double, normY: Double, normW: Double, normH: Double ->
            val proc = processor ?: return@AsyncFunction mapOf(
                "probability" to 0.5,
                "latencyMs" to 0,
                "error" to "Processor not initialized"
            )

            try {
                val decodedBytes = Base64.decode(base64Data, Base64.DEFAULT)
                val bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.size)

                val (prob, latencyMs) = proc.processCrop(
                    bitmap,
                    normX.toFloat(),
                    normY.toFloat(),
                    normW.toFloat(),
                    normH.toFloat()
                )

                mapOf(
                    "probability" to prob.toDouble(),
                    "latencyMs" to latencyMs
                )
            } catch (e: Exception) {
                mapOf(
                    "probability" to 0.5,
                    "latencyMs" to 0,
                    "error" to (e.message ?: "Processing error")
                )
            }
        }
    }
}
