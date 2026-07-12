package com.forgehabits.app.glance

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.forgehabits.app.MainActivity
import com.forgehabits.app.WidgetHeatmapDay
import com.forgehabits.app.WidgetSnapshotRepository

// Number of most-recent days actually displayed in the widget grid. This is
// a presentation-layer decision only - the underlying snapshot from
// HabitsContext.tsx still generates 70 days of history unchanged. Taking the
// most recent slice here (rather than truncating upstream) keeps the data
// model and the widget's display window independent, so this can be
// changed back to 70 (or any other value) without touching JS.
private const val HEATMAP_DISPLAY_DAYS = 50

// Number of rows in the displayed grid. HEATMAP_DISPLAY_DAYS must be evenly
// divisible by this for a clean rectangular grid (50 / 5 = 10 columns).
private const val HEATMAP_ROWS = 5

class HeatmapGlanceWidget : GlanceAppWidget() {
    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val snapshot = WidgetSnapshotRepository.read(context)
        provideContent {
            GlanceTheme {
                HeatmapContent(
                    streak = snapshot?.streak ?: 0,
                    heatmap = snapshot?.heatmap ?: emptyList()
                )
            }
        }
    }
}

@Composable
private fun HeatmapContent(streak: Int, heatmap: List<WidgetHeatmapDay>) {
    val context = LocalContext.current
    val size = LocalSize.current
    val openAppIntent = Intent(context, MainActivity::class.java)

    val displayHeatmap = heatmap.takeLast(HEATMAP_DISPLAY_DAYS)
    val weeks = displayHeatmap.chunked(HEATMAP_ROWS)
    val cols = weeks.size.coerceAtLeast(1)
    val paddingPx = 12f
    val headerHeight = 24f
    val gap = 3f

    // Driven by LocalSize.current under SizeMode.Exact - real, continuous
    // responsive sizing.
    val availableWidth = (size.width.value - paddingPx * 2).coerceAtLeast(40f)
    val availableHeight = (size.height.value - paddingPx * 2 - headerHeight).coerceAtLeast(30f)
    val cellFromWidth = (availableWidth - gap * (cols - 1)) / cols
    val cellFromHeight = (availableHeight - gap * (HEATMAP_ROWS - 1)) / HEATMAP_ROWS
    val cellSize = minOf(cellFromWidth, cellFromHeight).coerceAtLeast(4f)

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceColors.BG)
            .padding(paddingPx.dp)
            .clickable(actionStartActivity(openAppIntent))
    ) {
        Text(
            text = "$streak day streak",
            style = TextStyle(color = GlanceColors.TEXT, fontWeight = FontWeight.Bold)
        )
        Row {
            weeks.forEachIndexed { wi, week ->
                Column(
                    modifier = if (wi < weeks.size - 1)
                        GlanceModifier.padding(end = gap.dp)
                    else
                        GlanceModifier
                ) {
                    week.forEachIndexed { index, day ->
                        val cellColor = when {
                            !day.hasData -> GlanceColors.TRACK
                            day.pct <= 0.0 -> GlanceColors.TRACK
                            day.pct < 0.25 -> GlanceColors.ACCENT_DIM
                            day.pct < 0.50 -> GlanceColors.ACCENT_MID
                            day.pct < 1.0 -> GlanceColors.ACCENT
                            else -> GlanceColors.ACCENT_STRONG
                        }
                        Box(
                            modifier = GlanceModifier
                                .size(cellSize.dp)
                                .background(cellColor)
                                .cornerRadius((cellSize * 0.2f).dp)
                        ) {}
                        if (index != week.lastIndex) {
                            Spacer(modifier = GlanceModifier.size(gap.dp))
                        }
                    }
                }
            }
        }
    }
}
