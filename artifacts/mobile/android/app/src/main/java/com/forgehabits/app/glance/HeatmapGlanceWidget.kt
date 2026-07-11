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
import androidx.glance.appwidget.lazy.LazyColumn
import androidx.glance.appwidget.lazy.items
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.*
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
private fun HeatmapContent(
    streak: Int,
    heatmap: List<WidgetHeatmapDay>
) {
    val context = LocalContext.current
    val size = LocalSize.current
    val openAppIntent = Intent(context, MainActivity::class.java)

    val weeks = heatmap.chunked(7)
    val cols = weeks.size.coerceAtLeast(1)

    val paddingPx = when {
        size.width.value < 150f -> 6f
        size.width.value < 220f -> 8f
        else -> 12f
    }

    val headerHeight = 34f  // streak text + 6dp spacer, with safety margin

    val availableWidth =
        (size.width.value - paddingPx * 2).coerceAtLeast(40f)

    val availableHeight =
        (size.height.value - paddingPx * 2 - headerHeight - 10f) // safety margin for RemoteViews rounding
            .coerceAtLeast(30f)

    val provisionalGap = 3f

    val provisionalCellFromWidth =
        (availableWidth - provisionalGap * (cols - 1)) / cols

    val provisionalCellFromHeight =
        (availableHeight - provisionalGap * 6) / 7

    val provisionalCellSize =
        minOf(provisionalCellFromWidth, provisionalCellFromHeight).coerceAtLeast(4f)

    val gap = when {
        provisionalCellSize >= 14f -> 4f
        provisionalCellSize >= 9f -> 3f
        else -> 2f
    }

    // Second pass: recompute cell size using the FINAL gap, since a larger
    // final gap than the provisional guess would otherwise silently blow
    // the height/width budget and clip rows/columns.
    val cellFromWidth =
        (availableWidth - gap * (cols - 1)) / cols

    val cellFromHeight =
        (availableHeight - gap * 6) / 7

    val cellSize =
        minOf(cellFromWidth, cellFromHeight).coerceAtLeast(4f)

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceColors.BG)
            .padding(paddingPx.dp)
            .clickable(actionStartActivity(openAppIntent)),
        horizontalAlignment = Alignment.Horizontal.CenterHorizontally
    ) {

        Text(
            text = "$streak day streak",
            style = TextStyle(
                color = GlanceColors.TEXT,
                fontWeight = FontWeight.Bold
            )
        )

        Spacer(GlanceModifier.size(6.dp))

        Text(
            text = "DBG weeks=${weeks.size} last5=" + heatmap.takeLast(5).joinToString(" | ") {
                "hd=${it.hasData},pct=${"%.2f".format(it.pct)}"
            },
            style = TextStyle(color = GlanceColors.ACCENT)
        )

        // Grid is built with LazyColumn/items() row-by-row, the same
        // construct confirmed working for the Tasks widget's checkbox
        // background. A plain forEach-built Row/Column grid does NOT
        // reliably render per-cell background colors in this Glance
        // version - LazyColumn's item-based rendering does.
        LazyColumn(modifier = GlanceModifier.fillMaxWidth()) {
            items(7, itemId = { it.toLong() }) { rowIndex ->
                Row(modifier = GlanceModifier.padding(bottom = gap.dp)) {
                    weeks.forEachIndexed { wi, week ->
                        val day = week.getOrNull(rowIndex)
                        if (day != null) {
                            val color = when {
                                !day.hasData -> GlanceColors.TRACK
                                day.pct <= 0.0 -> GlanceColors.ACCENT_DIM
                                day.pct < 0.5 -> GlanceColors.ACCENT_MID
                                else -> GlanceColors.ACCENT
                            }

                            Box(
                                modifier = GlanceModifier
                                    .size(cellSize.dp)
                                    .background(color)
                                    .cornerRadius((cellSize * 0.2f).dp)
                            ) {}

                            if (wi < weeks.size - 1) {
                                Spacer(modifier = GlanceModifier.size(gap.dp))
                            }
                        }
                    }
                }
            }
        }
    }
}
