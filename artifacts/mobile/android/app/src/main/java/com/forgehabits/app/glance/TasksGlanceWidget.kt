package com.forgehabits.app.glance

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
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

class TasksGlanceWidget : GlanceAppWidget() {
    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val snapshot = WidgetSnapshotRepository.read(context)
        provideContent {
            GlanceTheme {
                TasksContent(
                    completed = snapshot?.completed ?: 0,
                    total = snapshot?.total ?: 0,
                    habits = snapshot?.habits ?: emptyList()
                )
            }
        }
    }
}

@Composable
private fun TasksContent(completed: Int, total: Int, habits: List<WidgetHabit>) {
    val context = LocalContext.current
    val openAppIntent = Intent(context, MainActivity::class.java)

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(GlanceColors.BG)
            .padding(12.dp)
    ) {
        Text(
            text = "Today ($completed/$total)",
            style = GlanceTypography.Title
        )
        Spacer(GlanceModifier.height(6.dp))
        // LazyColumn = real, native scrolling - shows every habit, no
        // truncation, no ListWidget-collection-service headaches.
        LazyColumn(modifier = GlanceModifier.fillMaxWidth()) {
            items(habits, itemId = { it.id.hashCode().toLong() }) { habit ->
                Row(
                    modifier = GlanceModifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp)
                        .clickable(actionStartActivity(openAppIntent)),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Box(
                        modifier = GlanceModifier
                            .size(16.dp)
                            .background(if (habit.completed) GlanceColors.ACCENT else GlanceColors.BG)
                            .cornerRadius(4.dp)
                    ) {}
                    Spacer(GlanceModifier.width(8.dp))
                    Text(
                        text = habit.name,
                        style = TextStyle(color = if (habit.completed) GlanceColors.SUBTEXT else GlanceColors.TEXT)
                    )
                }
            }
        }
    }
}
