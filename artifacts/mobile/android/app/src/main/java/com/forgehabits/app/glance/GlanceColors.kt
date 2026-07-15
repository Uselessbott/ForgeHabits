package com.forgehabits.app.glance

import androidx.compose.ui.graphics.Color
import androidx.glance.unit.ColorProvider

// Shared palette across all 4 Glance widgets - matches the ember-orange/
// dark theme used in the widget preview thumbnails.
object GlanceColors {
    val BG = ColorProvider(Color(0xFF080808))
    val ACCENT = ColorProvider(Color(0xFFDF5B1B))
    val ACCENT_STRONG = ColorProvider(Color(0xFFDF5B1B))
    val ACCENT_DIM = ColorProvider(Color(0xFF4A1E09))
    val ACCENT_MID = ColorProvider(Color(0xFF863710))
    val TEXT = ColorProvider(Color(0xFFF0F0F0))
    val SUBTEXT = ColorProvider(Color(0xFF969696))
    val TRACK = ColorProvider(Color(0xFF1C1C1C))

    // Plain ARGB ints for use with android.graphics.Paint, which doesn't
    // accept Glance's ColorProvider.
    const val ACCENT_ARGB = 0xFFDF5B1B.toInt()
    const val TRACK_ARGB = 0xFF1C1C1C.toInt()
}

// Linear interpolation from dark track-adjacent orange to full #DF5B1B,
// driven directly by completion ratio (0.0-1.0) - continuous, not stepped.
fun interpolateAccentColor(pct: Float): androidx.glance.unit.ColorProvider {
    val start = androidx.compose.ui.graphics.Color(0xFF4A1E09)
    val end = androidx.compose.ui.graphics.Color(0xFFDF5B1B)
    val r = start.red + (end.red - start.red) * pct
    val g = start.green + (end.green - start.green) * pct
    val b = start.blue + (end.blue - start.blue) * pct
    return androidx.glance.unit.ColorProvider(androidx.compose.ui.graphics.Color(r, g, b))
}
