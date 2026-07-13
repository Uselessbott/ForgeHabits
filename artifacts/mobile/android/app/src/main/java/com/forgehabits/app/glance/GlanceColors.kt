package com.forgehabits.app.glance

import androidx.compose.ui.graphics.Color
import androidx.glance.unit.ColorProvider

// Shared palette across all 4 Glance widgets - matches the ember-orange/
// dark theme used in the widget preview thumbnails.
object GlanceColors {
    val BG = ColorProvider(Color(0xFF080808))
    val ACCENT = ColorProvider(Color(0xFFE67E00))
    val ACCENT_STRONG = ColorProvider(Color(0xFFFFA000))
    val ACCENT_DIM = ColorProvider(Color(0xFF5B3208))
    val ACCENT_MID = ColorProvider(Color(0xFFA85A00))
    val TEXT = ColorProvider(Color(0xFFF0F0F0))
    val SUBTEXT = ColorProvider(Color(0xFF969696))
    val TRACK = ColorProvider(Color(0xFF1C1C1C))

    // Plain ARGB ints for use with android.graphics.Paint, which doesn't
    // accept Glance's ColorProvider.
    const val ACCENT_ARGB = 0xFFE67E00.toInt()
    const val TRACK_ARGB = 0xFF1C1C1C.toInt()
}
