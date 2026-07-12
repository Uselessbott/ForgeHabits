package com.forgehabits.app.glance

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
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
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import com.forgehabits.app.MainActivity
import com.forgehabits.app.WidgetHabit
import com.forgehabits.app.WidgetSnapshotRepository

class CombinedGlanceWidget : GlanceAppWidget() {
    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val snapshot = WidgetSnapshotRepository.read(context)
        provideContent {
            GlanceTheme {
                CombinedContent(
                    completed = snapshot?.completed ?: 0,
                    total = snapshot?.total ?: 0,
                    streak = snapshot?.streak ?: 0,
                    habits = snapshot?.habits ?: emptyList()
                )
            }
        }
    }
}

@Composable
private fun CombinedContent(completed: Int, total: Int, streak: Int, habits: List<WidgetHabit>) {
    val context = LocalContext.current
    val openAppIntent = Intent(context, MainActivity::class.java)
    val pct = if (total > 0) completed.toFloat() / total.toFloat() else 0f
    val size = LocalSize.current
    val ringSizeDp = (size.height.value * 0.35f).coerceIn(36f, 72f)
    val ringSizePx = (ringSizeDp * context.resources.displayMetrics.density).toInt().coerceAtLeast(1)
    val ringBitmap = remember(pct, ringSizePx) {
        ProgressRingRenderer.render(ringSizePx, pct, GlanceColors.ACCENT_ARGB, GlanceColors.TRACK_ARGB)
    }

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceColors.BG)
            .padding(12.dp)
    ) {
        Row(
            modifier = GlanceModifier
                .fillMaxWidth()
                .clickable(actionStartActivity(openAppIntent)),
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            Box(modifier = GlanceModifier.size(ringSizeDp.dp), contentAlignment = Alignment.Center) {
                Image(
                    provider = ImageProvider(ringBitmap),
                    contentDescription = null,
                    modifier = GlanceModifier.size(ringSizeDp.dp)
                )
                Text(
                    text = "${(pct * 100).toInt()}%",
                    style = TextStyle(color = GlanceColors.TEXT, fontWeight = FontWeight.Bold)
                )
            }
            Spacer(GlanceModifier.width(10.dp))
            Column {
                Text(text = "$completed/$total done", style = TextStyle(color = GlanceColors.TEXT))
                Text(text = "$streak day streak", style = TextStyle(color = GlanceColors.ACCENT))
            }
        }
        Spacer(GlanceModifier.height(8.dp))
        LazyColumn(modifier = GlanceModifier.fillMaxWidth()) {
            items(habits, itemId = { it.id.hashCode().toLong() }) { habit ->
                Row(
                    modifier = GlanceModifier
                        .fillMaxWidth()
                        .padding(vertical = 3.dp)
                        .clickable(actionStartActivity(openAppIntent)),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Box(
                        modifier = GlanceModifier
                            .size(14.dp)
                            .background(if (habit.completed) GlanceColors.ACCENT else GlanceColors.BG)
                            .cornerRadius(3.dp)
                    ) {}
                    Spacer(GlanceModifier.width(6.dp))
                    Text(
                        text = habit.name,
                        style = TextStyle(color = if (habit.completed) GlanceColors.SUBTEXT else GlanceColors.TEXT)
                    )
                }
            }
        }
    }
}
