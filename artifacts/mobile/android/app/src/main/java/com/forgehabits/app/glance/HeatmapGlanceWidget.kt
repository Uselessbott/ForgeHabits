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
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.Spacer
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.forgehabits.app.MainActivity
import com.forgehabits.app.WidgetHeatmapDay
import com.forgehabits.app.WidgetSnapshotRepository

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

    val weeks = heatmap.chunked(7)
    val cols = weeks.size.coerceAtLeast(1)
    val paddingPx = 12f
    val headerHeight = 24f
    val gap = 3f
    // Driven by LocalSize.current under SizeMode.Exact - this is real,
    // continuous responsive sizing, not the broken widgetInfo plumbing
    // from the old react-native-android-widget implementation.
    val availableWidth = (size.width.value - paddingPx * 2).coerceAtLeast(40f)
    val availableHeight = (size.height.value - paddingPx * 2 - headerHeight).coerceAtLeast(30f)
    val cellFromWidth = (availableWidth - gap * (cols - 1)) / cols
    val cellFromHeight = (availableHeight - gap * 6) / 7
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
        Text(
            text = "H=${"%.1f".format(size.height.value)} avail=${"%.1f".format(availableHeight)} " +
                "cell=${"%.1f".format(cellSize)} need=${"%.1f".format(7 * cellSize + 6 * gap)} " +
                "hdr=${"%.1f".format(headerHeight)} pad=${"%.1f".format(paddingPx)}",
            style = TextStyle(color = GlanceColors.ACCENT)
        )
        Box(modifier = GlanceModifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Row {
                weeks.forEachIndexed { wi, week ->
                    Column(
                        modifier = if (wi < weeks.size - 1)
                            GlanceModifier.padding(end = gap.dp)
                        else
                            GlanceModifier
                    ) {
                        week.forEachIndexed { index, day ->
                            val cellColor = GlanceColors.ACCENT // TEMP: force all cells orange to isolate clipping vs color bug
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
}
