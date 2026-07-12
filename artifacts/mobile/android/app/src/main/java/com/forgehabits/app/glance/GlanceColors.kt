package com.forgehabits.app.glance

import androidx.compose.ui.graphics.Color
import androidx.glance.unit.ColorProvider

// Shared palette across all 4 Glance widgets - matches the ember-orange/
// dark theme used in the widget preview thumbnails.
object GlanceColors {
    val BG = ColorProvider(Color(0xFF080808))
    val ACCENT = ColorProvider(Color(0xFFFF6B35))
    val ACCENT_STRONG = ColorProvider(Color(0xFFFF3D00))
    val ACCENT_DIM = ColorProvider(Color(0xFF5A2D19))
    val ACCENT_MID = ColorProvider(Color(0xFFC2552B))
    val TEXT = ColorProvider(Color(0xFFF0F0F0))
    val SUBTEXT = ColorProvider(Color(0xFF969696))
    val TRACK = ColorProvider(Color(0xFF1C1C1C))

    // TEMPORARY DIAGNOSTIC COLORS - wildly different, unmistakable hues to
    // rule out "colors too visually similar to distinguish" vs "background
    // genuinely not rendering at all." Swap heatmap cell colors to these.
    val DBG_TRACK = ColorProvider(Color(0xFF0000FF))      // pure blue
    val DBG_ACCENT_DIM = ColorProvider(Color(0xFF9B30FF))  // purple
    val DBG_ACCENT_MID = ColorProvider(Color(0xFF00FF00))  // bright green
    val DBG_ACCENT = ColorProvider(Color(0xFFFFFF00))      // bright yellow

    // Plain ARGB ints for use with android.graphics.Paint, which doesn't
    // accept Glance's ColorProvider.
    const val ACCENT_ARGB = 0xFFFF6B35.toInt()
    const val TRACK_ARGB = 0xFF2A2A2A.toInt()
}
