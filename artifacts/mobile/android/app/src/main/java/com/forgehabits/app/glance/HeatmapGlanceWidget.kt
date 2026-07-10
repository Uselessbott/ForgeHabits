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
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.padding
import androidx.glance.layout.Spacer
import androidx.glance.layout.size
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
                    heatmap = snapshot?.heatmap ?: emptyList(),
                    snapshotToday = snapshot?.today ?: "null"
                )
            }
        }
    }
}

@Composable
private fun HeatmapContent(streak: Int, heatmap: List<WidgetHeatmapDay>, snapshotToday: String = "") {
    val context = LocalContext.current
    val size = LocalSize.current
    val openAppIntent = Intent(context, MainActivity::class.java)

    val weeks = heatmap.chunked(7)
    val cols = weeks.size.coerceAtLeast(1)
    val paddingPx = 12f
    val headerHeight = 24f
    val gap = 3f
    val availableWidth = (size.width.value - paddingPx * 2).coerceAtLeast(40f)
    val availableHeight = (size.height.value - paddingPx * 2 - headerHeight).coerceAtLeast(30f)
    val cellFromWidth = (availableWidth - gap * (cols - 1)) / cols
    val cellFromHeight = (availableHeight - gap * 6) / 7
    val cellSize = minOf(cellFromWidth, cellFromHeight).coerceAtLeast(4f)

    val lastDay = heatmap.lastOrNull()
    val lastDayBranch = when {
        lastDay == null -> "NULL"
        !lastDay.hasData -> "TRACK"
        lastDay.pct <= 0.0 -> "ACCENT_DIM"
        lastDay.pct < 0.5 -> "ACCENT_MID"
        else -> "ACCENT"
    }

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
            text = "DBG today=$snapshotToday last=${lastDay?.date} pct=${lastDay?.pct} branch=$lastDayBranch n=${heatmap.size}",
            style = TextStyle(color = GlanceColors.ACCENT)
        )
        // REWRITE: grid is now built with LazyColumn/items(), the same
        // construct confirmed working for the Tasks widget's checkbox
        // background (a plain forEach-built Row/Column grid was NOT
        // rendering per-cell background colors correctly, even after
        // ruling out cornerRadius interaction and Compose recomposition
        // identity via key() - both disproven by direct on-device testing).
        // Each LazyColumn item is one weekday-row; each row is a plain Row
        // of that week's cells across all weeks.
        LazyColumn(modifier = GlanceModifier.fillMaxWidth()) {
            items(7, itemId = { it.toLong() }) { rowIndex ->
                Row(modifier = GlanceModifier.padding(bottom = gap.dp)) {
                    weeks.forEachIndexed { wi, week ->
                        val day = week.getOrNull(rowIndex)
                        if (day != null) {
                            val cellColor = when {
                                !day.hasData -> GlanceColors.TRACK
                                day.pct <= 0.0 -> GlanceColors.ACCENT_DIM
                                day.pct < 0.5 -> GlanceColors.ACCENT_MID
                                else -> GlanceColors.ACCENT
                            }
                            Box(
                                modifier = GlanceModifier
                                    .size(cellSize.dp)
                                    .background(cellColor)
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
