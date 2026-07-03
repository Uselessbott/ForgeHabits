package com.forgehabits.app

import android.content.ContentProvider
import android.content.ContentValues
import android.content.Intent
import android.database.Cursor
import android.net.Uri

class CrashCatcherProvider : ContentProvider() {
    override fun onCreate(): Boolean {
        Thread.setDefaultUncaughtExceptionHandler { _, e ->
            val trace = e.stackTraceToString()
            val intent = Intent(Intent.ACTION_SEND).apply {
                type = "text/plain"
                putExtra(Intent.EXTRA_TEXT, trace)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            try {
                context?.startActivity(Intent.createChooser(intent, "ForgeHabits Crash"))
            } catch (_: Exception) {}
        }
        return true
    }

    override fun query(uri: Uri, projection: Array<String>?, selection: String?, selectionArgs: Array<String>?, sortOrder: String?): Cursor? = null
    override fun getType(uri: Uri): String? = null
    override fun insert(uri: Uri, values: ContentValues?): Uri? = null
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<String>?): Int = 0
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<String>?): Int = 0
}
