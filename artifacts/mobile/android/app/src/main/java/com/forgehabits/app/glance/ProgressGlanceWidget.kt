package com.forgehabits.app.glance

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
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
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import com.forgehabits.app.MainActivity
import com.forgehabits.app.WidgetSnapshotRepository

private val BG = ColorProvider(Color(0xFF080808))
private val ACCENT = ColorProvider(Color(0xFFFF6B35))
private val TEXT = ColorProvider(Color(0xFFF0F0F0))
private val SUBTEXT = ColorProvider(Color(0xFF969696))

class ProgressGlanceWidget : GlanceAppWidget() {

    // Exact mode: LocalSize.current reflects the widget's true current
    // dimensions in real time, and content recomposes on every resize.
    // This is the mechanism that fixes clipping/non-scaling - it is not
    // decorative, it's the actual responsive-sizing engine.
    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        // Reads whatever HabitsContext.refreshWidget() last wrote in Phase 2.
        // Null (no snapshot yet, e.g. widget added before app ever opened)
        // is handled as a valid zero-habits state, not an error.
        val snapshot = WidgetSnapshotRepository.read(context)

        provideContent {
            GlanceTheme {
                ProgressContent(
                    completed = snapshot?.completed ?: 0,
                    total = snapshot?.total ?: 0,
                    streak = snapshot?.streak ?: 0
                )
            }
        }
    }
}

@Composable
private fun ProgressContent(completed: Int, total: Int, streak: Int) {
    val size = LocalSize.current
    val context = LocalContext.current
    val shortestSide = if (size.width < size.height) size.width else size.height
    // Ring diameter scales continuously with the widget's shortest side,
    // clamped to a legible range - replaces the old fixed-64dp ring that
    // never grew or shrank with the widget.
    val ringSize = (shortestSide.value * 0.5f).coerceIn(36f, 96f)
    val pct = if (total > 0) completed.toFloat() / total.toFloat() else 0f

    val openAppIntent = Intent(context, MainActivity::class.java)

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(BG)
            .padding(8.dp)
            .clickable(actionStartActivity(openAppIntent)),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
            Box(
                modifier = GlanceModifier
                    .size(ringSize.dp)
                    .background(ACCENT)
                    .cornerRadius(ringSize.dp / 2),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "${(pct * 100).toInt()}%",
                    style = TextStyle(color = TEXT, fontWeight = FontWeight.Bold)
                )
            }
            Text(
                text = "$completed/$total habits",
                style = TextStyle(color = SUBTEXT)
            )
            if (streak > 0) {
                Text(
                    text = "$streak day streak",
                    style = TextStyle(color = ACCENT)
                )
            }
        }
    }
}
