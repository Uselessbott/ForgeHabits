    @ReactMethod
    fun startMonkModeSession(habitsArray: ReadableArray, promise: Promise?) {
        moduleScope.launch {
            try {
                val session = MonkModeSessionManager.getInstance(reactApplicationContext)
                val habits = MonkModeSessionManager.habitsFromReadableArray(habitsArray)
                session.startSession(habits)

                val intent = Intent(
                    reactApplicationContext,
                    MonkModeService::class.java
                ).apply {
                    action = MonkModeService.ACTION_START
                }

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    reactApplicationContext.startForegroundService(intent)
                } else {
                    reactApplicationContext.startService(intent)
                }

                val map = Arguments.createMap()
                map.putBoolean("isActive", true)
                map.putString("message", "Monk Mode started")
                if (promise != null) {
                    promise.resolve(map)
                }
            } catch (e: Exception) {
                if (promise != null) {
                    promise.reject(
                        "MONK_MODE_ERROR",
                        "Failed to start session: ${e.message}",
                        e
                    )
                }
            }
        }
    }
