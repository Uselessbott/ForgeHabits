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
import androidx.glance.layout.*
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.forgehabits.app.MainActivity
import com.forgehabits.app.WidgetHeatmapDay
import com.forgehabits.app.WidgetSnapshotRepository

private const val CELL_SIZE_DP = 18f
private const val CELL_GAP_DP = 3f
private const val HEATMAP_ROWS = 7

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

    val paddingPx = 12f
    val headerHeight = 24f
    val gap = CELL_GAP_DP

    val availableWidth =
        (size.width.value - paddingPx * 2).coerceAtLeast(40f)

    val availableHeight =
        (size.height.value - paddingPx * 2 - headerHeight)
            .coerceAtLeast(30f)

    val cols = ((heatmap.size + HEATMAP_ROWS - 1) / HEATMAP_ROWS)
        .coerceAtLeast(1)

    val cellFromWidth =
        (availableWidth - gap * (cols - 1)) / cols

    val cellFromHeight =
        (availableHeight - gap * (HEATMAP_ROWS - 1)) / HEATMAP_ROWS

    val cellSize =
        minOf(cellFromWidth, cellFromHeight)
            .coerceAtLeast(4f)

    val weeks = heatmap.chunked(HEATMAP_ROWS)

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceColors.BG)
            .padding(paddingPx.dp)
            .clickable(actionStartActivity(openAppIntent))
    ) {
        Text(
            text = "$streak day streak (${size.width.value.toInt()}×${size.height.value.toInt()})",
            style = TextStyle(color = GlanceColors.TEXT, fontWeight = FontWeight.Bold)
        )

        Spacer(GlanceModifier.size(6.dp))

        Box(
            modifier = GlanceModifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Row {
                weeks.forEachIndexed { wi, week ->
                    Column(
                        modifier = if (wi < weeks.size - 1)
                            GlanceModifier.padding(end = CELL_GAP_DP.dp)
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
                                Spacer(modifier = GlanceModifier.size(CELL_GAP_DP.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}
