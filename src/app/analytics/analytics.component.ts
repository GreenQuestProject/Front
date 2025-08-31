import { Component, OnInit, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { GamificationService } from '../services/gamification.service';
import { AnalyticsService } from '../services/analytics.service';
import { GamificationProfile, LeaderboardItem, OverviewResponse } from '../interfaces/analytics';
import {forkJoin} from 'rxjs';
import {NavBarComponent} from '../nav-bar/nav-bar.component';
import {MatProgressSpinner} from '@angular/material/progress-spinner';
import {MatCard, MatCardContent} from '@angular/material/card';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, NavBarComponent, MatProgressSpinner, MatCard, MatCardContent],
  templateUrl: './analytics.component.html',
  styleUrl: './analytics.component.scss'
})
export class AnalyticsComponent implements OnInit {
  private gamification = inject(GamificationService);
  private analytics = inject(AnalyticsService);

// signals for state
  loading = signal(true);
  error = signal<string | null>(null);

  profile = signal<GamificationProfile | null>(null);
  leaderboard = signal<LeaderboardItem[]>([]);
  overview = signal<OverviewResponse | null>(null);

  userRank = computed(() => {
    const lb = this.leaderboard();
    const me = this.profile();
    if (!lb || !me) return null;
    const usernameGuess = 'me'; // Replace with actual username if available in auth context.
    const idx = lb.findIndex(x => x.username === usernameGuess);
    return idx >= 0 ? idx + 1 : null;
  });

  lineData: ChartConfiguration['data'] = { labels: [], datasets: [] };
  lineOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { title: { display: true, text: 'ISO Weeks' } },
      y: { title: { display: true, text: 'Challenges completed' }, beginAtZero: true }
    },
    plugins: {
      legend: { display: true, position: 'bottom' },
      tooltip: { mode: 'index', intersect: false }
    }
  };
  ngOnInit() {
    forkJoin({
      profile: this.gamification.getProfile(),
      leaderboard: this.gamification.getLeaderboard(),
      overview: this.analytics.getOverviewPublic(),
    }).subscribe({
      next: ({ profile, leaderboard, overview }) => {
        this.profile.set(profile);
        this.leaderboard.set(leaderboard.items ?? []);
        this.overview.set(overview);
        this.buildTrendChart();
      },
      error: (e) => this.error.set(e?.error?.message || 'Une erreur est survenue'),
      complete: () => this.loading.set(false),
    });
  }

  private buildTrendChart() {
    const ov = this.overview();
    if (!ov) return;

    const labels = ov.weekly.map(w => w.x);
    const community = ov.weekly.map(w => w.y);

    this.lineData = {
      labels,
      datasets: [
        {
          label: 'Communauté — défis terminés',
          data: community,
          fill: false,
          tension: 0.25,
          pointRadius: 3,
          borderWidth: 2,
        },
      ],
    };
  }
}
