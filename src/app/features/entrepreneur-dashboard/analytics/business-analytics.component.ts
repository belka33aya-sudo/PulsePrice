import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, QueryList, ViewChildren } from '@angular/core';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INTERFACES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface KPI {
  label: string;
  value: string;
  delta: string;
  isPositive: boolean;
  color: string;
  trend: number[];
}

interface PlatformStat {
  name: string;
  logo: string;
  items: number;
  avgPrice: number;
  winRate: number;
  revenueShare: number;
  trend: number[];
}

interface Product {
  name: string;
  revenue: number;
  margin: number;
  image: string;
  history: number[];
}

interface Insight {
  type: 'win' | 'risk' | 'watch';
  title: string;
  message: string;
  product?: string;
  timeAgo: string;
}

interface CompetitorRank {
  name: string;
  score: number;
  winRate: number;
  avgPrice: number;
  skus: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

@Component({
  selector: 'app-business-analytics',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe, RouterModule],
  animations: [
    trigger('drawerSlide', [
      transition(':enter', [
        style({ transform: 'translateX(100%)' }),
        animate('400ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ transform: 'translateX(100%)' }))
      ])
    ]),
    trigger('pageEnter', [
      transition(':enter', [
        query('.animate-in', [
          style({ opacity: 0, transform: 'translateY(15px)' }),
          stagger(100, [
            animate('400ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="analytics-page">
      <!-- 1. PAGE HEADER -->
      <section class="page-top">
        <div class="header-main">
          <h1>Analytics Overview</h1>
          <p class="description">Enterprise market intelligence and cross-platform performance metrics.</p>
        </div>
        <div class="global-actions">

           <div class="segmented-control">
               <button *ngFor="let range of dateRanges" 
                       [class.active]="activeRange === range"
                       (click)="onRangeChange(range)">
                 {{ range }}
               </button>
           </div>
            <button class="export-btn-premium" (click)="downloadReport()">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path></svg>
               <span>{{ isGeneratingReport ? 'Generating...' : 'Download Report' }}</span>
            </button>
        </div>
      </section>

      <!-- NEW: VIEW TABS -->
      <div class="main-view-tabs">
        <button class="view-tab" [class.active]="activeTab === 'market'" (click)="setTab('market')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
          Market Intelligence
        </button>
        <button class="view-tab" [class.active]="activeTab === 'products'" (click)="setTab('products')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Products & Categories
        </button>
      </div>

      <!-- 2. KPI HERO BANNER -->
      <section class="kpi-banner-wrap">
        <div class="kpi-grid-refined">
          <div class="kpi-box-refined" *ngFor="let kpi of kpis">
             <div class="top-row">
                <span class="label-heading">{{ kpi.label }}</span>
                <span class="delta-badge" [style.color]="kpi.color" [style.background-color]="kpi.color + '15'">
                  {{ kpi.delta }}
                </span>
             </div>
             <div class="value-main-row">
                <h2 class="tabular-nums">{{ kpi.value }}</h2>
             </div>
             <div class="footer-row">
                <span class="comparison-text" [style.color]="kpi.isPositive ? 'var(--success)' : 'var(--danger)'">
                  {{ kpi.delta }} vs last period
                </span>
                <div class="mini-spark-container">
                   <canvas #sparklineCanvas></canvas>
                </div>
             </div>
          </div>
        </div>
      </section>

      <!-- 3. REVENUE & MARGIN + DONUT -->
      <section class="analysis-layout-grid" [class.d-none]="activeTab !== 'products'">
        <!-- Main Chart -->
        <div class="panel-card chart-hero-panel">
          <div class="panel-header">
             <div class="title-meta-stack">
                <h3>Revenue & Margin Trends</h3>
                <div class="chart-summary-badges">
                   <div class="s-badge revenue">
                      <span class="s-label">Total Revenue</span>
                      <span class="s-val">$284.9k</span>
                   </div>
                   <div class="s-badge margin">
                      <span class="s-label">Avg Margin</span>
                      <span class="s-val">34.2%</span>
                   </div>
                </div>
             </div>
             <div class="view-mode-pill">
                <button [class.p-active]="viewMode === 'Revenue'" (click)="updateViewMode('Revenue')">Revenue</button>
                <button [class.p-active]="viewMode === 'Margin'" (click)="updateViewMode('Margin')">Margin</button>
                <button [class.p-active]="viewMode === 'Both'" (click)="updateViewMode('Both')">Unified</button>
             </div>
          </div>
          <div class="panel-body chart-height-fixed professional-chart-wrap">
             <canvas #revenueMarginCanvas></canvas>
             <!-- CUSTOM TOOLTIP CONTAINER (Optional Placeholder for High-End Interaction) -->
          </div>
          <div class="panel-footer-legend">
             <div class="legend-pill">
                <span class="legend-dot" style="background: rgba(59, 130, 246, 0.7)"></span>
                Gross Revenue (USD)
             </div>
             <div class="legend-pill">
                <span class="legend-line" style="background: #10B981"></span>
                Profit Margin (%)
             </div>
          </div>
        </div>

        <!-- Category Pricing -->
        <div class="panel-card category-side-panel">
           <div class="panel-header">
              <h3>Avg. Price / Category</h3>
           </div>
           <div class="panel-body">
              <div class="donut-hero-container">
                 <canvas #avgPriceCategoryCanvas></canvas>
                 <div class="donut-center-meta">
                    <span class="center-val">$842</span>
                    <span class="center-sub">AVERAGE</span>
                 </div>
              </div>
              <div class="category-legend-stack">
                 <div class="legend-item-row" *ngFor="let cat of categoryPricing">
                    <div class="legend-key">
                       <span class="legend-color-dot" [style.background-color]="cat.color"></span>
                       {{ cat.category }}
                    </div>
                    <span class="legend-val tabular-nums">{{ cat.avgPrice | currency }}</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <!-- 4. MARKET LEADERBOARD -->
      <section class="panel-card full-span-card" [class.d-none]="activeTab !== 'market'">
        <div class="panel-header space-between-center">
           <div class="stacked-title">
              <h3>Market Leaderboard</h3>
              <p class="subtitle-muted">Competitor strength scoring based on win-rate and pricing.</p>
           </div>
           <span class="time-label">LATEST 7D</span>
        </div>
        <div class="panel-body">
           <div class="competitors-tiles-row">
              <div class="comp-tile-premium" *ngFor="let r of competitorRanks; let i = index" [class.leader-gold-top]="i === 0">
                 <div class="dim-rank-bg">#{{ i+1 }}</div>
                 <div class="comp-top-info">
                    <div class="comp-avatar">{{ r.name.charAt(0) }}</div>
                    <span class="comp-brand-name">{{ r.name }}</span>
                 </div>
                 <div class="comp-score-big">
                    <div class="score-group">
                       <span class="val-num-bold">{{ r.score }}</span>
                       <span class="trend-indicator" [style.color]="r.trend === 'up' ? 'var(--success)' : (r.trend === 'down' ? 'var(--danger)' : 'var(--text-muted)')">
                          {{ r.trend === 'up' ? '↑' : (r.trend === 'down' ? '↓' : '→') }}
                       </span>
                    </div>
                    <span class="score-cap">Win Score</span>
                 </div>
                 <div class="comp-stats-grid">
                    <div class="m-stat">
                       <span class="m-label">WIN</span>
                       <span class="m-value">{{ r.winRate }}%</span>
                    </div>
                    <div class="m-sep"></div>
                    <div class="m-stat">
                       <span class="m-label">PRICE</span>
                       <span class="m-value">{{ r.avgPrice | currency }}</span>
                    </div>
                 </div>
                 <div class="comp-foot-progress">
                    <div class="bar-track"><div class="bar-fill" [style.width.%]="(r.score / 1000) * 100" [style.background-color]="r.color"></div></div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <!-- 5. STATISTICAL CORRELATION -->
      <section class="panel-card full-span-card" [class.d-none]="activeTab !== 'market'">
         <div class="panel-header">
            <h3>Diagnostic Correlation Matrix</h3>
         </div>
         <div class="panel-body">
            <div class="correlation-view-split">
               <!-- HEATMAP -->
               <div class="heatmap-section">
                  <div class="section-title-box">
                     <h4>Metric Interdependence</h4>
                     <p>Quantifying how metrics drive performance</p>
                  </div>
                  <div class="heatmap-grid-display">
                     <div class="matrix-top-labels">
                        <div class="corner-pad"></div>
                        <span class="top-label" *ngFor="let label of productLabels">{{ label }}</span>
                     </div>
                     <div class="matrix-row-entry" *ngFor="let row of correlationData; let i = index">
                        <span class="side-label">{{ productLabels[i] }}</span>
                        <div class="cell-strip">
                           <div class="matrix-heat-cell" *ngFor="let val of row" 
                                [style.background-color]="getCorrelationColor(val)">
                              {{ val }}
                           </div>
                        </div>
                     </div>
                  </div>
                  <div class="heatmap-key-scale">
                     <span class="key-txt">Negative</span>
                     <div class="key-gradient"></div>
                     <span class="key-txt">Positive</span>
                  </div>
               </div>

               <!-- INSIGHTS -->
               <div class="insights-summary-section">
                  <div class="section-title-box">
                     <h4>Strategic Implications</h4>
                     <p>Extracted patterns for catalog optimization</p>
                  </div>
                  <div class="insights-list-vertical">
                     <div class="insight-row-modern" *ngFor="let insight of correlationInsights">
                        <div class="status-dot-lrg" [style.background-color]="insight.color"></div>
                        <div class="insight-meta-stack">
                           <span class="insight-heading-bold">{{ insight.label }}</span>
                           <span class="insight-detail-txt">{{ insight.explanation }}</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <!-- 6. MARKETPLACE TABLE -->
      <section class="panel-card full-span-card" [class.d-none]="activeTab !== 'market'">
         <div class="panel-header">
            <h3>Channel Performance Analysis</h3>
         </div>
         <div class="table-container-scroll">
            <table class="data-table-premium">
               <thead>
                  <tr>
                     <th class="l-align">Channel</th>
                     <th>Catalog</th>
                     <th>Avg Unit Price</th>
                     <th>Win Chance</th>
                     <th>Revenue Distribution</th>
                     <th>Volatility</th>
                  </tr>
               </thead>
               <tbody>
                  <tr *ngFor="let p of platformStats">
                     <td class="l-align">
                        <div class="channel-identity">
                           <div class="channel-avatar-box">{{ p.name.charAt(0) }}</div>
                           <span class="channel-name-bold">{{ p.name }}</span>
                        </div>
                     </td>
                     <td class="tabular-nums">{{ p.items }} Items</td>
                     <td class="tabular-nums font-weight-700">{{ p.avgPrice | currency }}</td>
                     <td>
                        <div class="win-chance-row">
                           <div class="chance-track-base"><div class="chance-fill-active" [style.width.%]="p.winRate" [style.background-color]="getWinRateColorByValue(p.winRate)"></div></div>
                           <span class="tabular-nums txt-tiny">{{ p.winRate }}%</span>
                        </div>
                     </td>
                     <td>
                        <div class="share-distribution-row">
                           <div class="distribution-track-wide">
                              <div class="distribution-fill-wide" [style.width.%]="p.revenueShare" [style.background-color]="getPlatformColor(p.name)"></div>
                           </div>
                           <span class="tabular-nums txt-tiny">{{ p.revenueShare }}%</span>
                        </div>
                     </td>
                     <td>
                        <div class="spark-table-wrap">
                           <canvas class="canvas-spark-table" #tableTrendCanvas></canvas>
                        </div>
                     </td>
                  </tr>
               </tbody>
            </table>
         </div>
      </section>

      <!-- 7. VELOCITY LEADERS + AI INSIGHTS -->
      <section class="two-column-bottom-section" [class.d-none]="activeTab !== 'products'">
         <div class="panel-card">
            <div class="panel-header space-between-center">
               <div class="stacked-title">
                  <h3>Catalog Velocity Leaders</h3>
                  <p class="subtitle-muted">Top performing items by daily revenue flow.</p>
               </div>
               <button class="link-btn-text">View All →</button>
            </div>
            <div class="velocity-stack-compact">
               <div class="product-row-velocity" *ngFor="let product of topProducts; let i = index">
                  <span class="velocity-rank-pill">{{ i+1 }}</span>
                  <div class="product-char-avatar">{{ product.name.charAt(0) }}</div>
                  <div class="product-info-column">
                     <span class="p-name-main">{{ product.name }}</span>
                     <span class="p-cat-sub">Market Category</span>
                  </div>
                  <div class="product-stats-group-end">
                     <div class="p-rev-val tabular-nums">{{ product.revenue | currency }}</div>
                     <span class="p-mgn-pill-label" [class]="getMarginClass(product.margin)">{{ product.margin }}% Margin</span>
                  </div>
                  <div class="p-spark-wrap-end">
                     <canvas class="canvas-spark-sku" #skuTrendCanvas></canvas>
                  </div>
               </div>
            </div>
         </div>

         <div class="panel-card stats-accents-panel">
            <div class="panel-header">
               <div class="stats-header-group">
                  <div class="stats-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 6l-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg></div>
                  <h3>Statistical Significance & Reliability</h3>
               </div>
            </div>
            <div class="stats-feed-vertical">
               <div class="stats-card-insight" *ngFor="let insight of insights" [style.border-left-color]="getInsightColor(insight.type)">
                  <div class="stats-card-meta-top">
                     <span class="stats-title-txt-bold">{{ insight.title }}</span>
                     <span class="stats-time-label-muted">{{ insight.timeAgo }}</span>
                  </div>
                  <p class="stats-detail-txt-muted">{{ insight.message }}</p>
                  <div class="stats-action-footer">
                     <button class="btn-action-outline" (click)="showStatsDetail(insight)">View Detailed Stats</button>
                  </div>
               </div>
            </div>
         </div>
      </section>

      <div class="drawer-overlay" *ngIf="showStatsModal" (click)="closeStatsModal()" [@pageEnter]></div>
      
      <aside class="stats-drawer" *ngIf="showStatsModal" [@drawerSlide]>
        <header class="drawer-header">
          <div class="header-left">
            <div class="icon-circle" [style.background-color]="getInsightColor(selectedInsight?.type || '')">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93"></path>
               </svg>
            </div>
            <div>
              <h3>{{ selectedInsight?.title }}</h3>
              <p>Analytical Data Analysis & Significance</p>
            </div>
          </div>
          <button class="close-btn" (click)="closeStatsModal()">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <div class="drawer-body">
          <div class="stats-premium-grid">
            <div class="stats-summary-hero-modern">
              <div class="hero-metric-pill" [style.border-left-color]="getInsightColor(selectedInsight?.type || '')">
                <span class="m-label">CONFIDENCE</span>
                <span class="m-val">98.4%</span>
              </div>
              <div class="hero-metric-pill" [style.border-left-color]="getInsightColor(selectedInsight?.type || '')">
                <span class="m-label">P-VALUE</span>
                <span class="m-val">0.0042</span>
              </div>
              <div class="hero-metric-pill" [style.border-left-color]="getInsightColor(selectedInsight?.type || '')">
                <span class="m-label">STABILITY</span>
                <span class="m-val">HIGH</span>
              </div>
            </div>

            <div class="detail-content-block-refined">
              <p class="stats-description-lrg">
                {{ selectedInsight?.message }}
              </p>
              
              <div class="variance-chart-container">
                <div class="chart-header-row">
                  <span class="c-title">Variance Distribution</span>
                </div>
                <canvas class="modal-variance-canvas" #modalVarianceCanvas></canvas>
              </div>

              <div class="stats-methodology-box">
                <div class="method-item">
                  <span class="meth-icon">∫</span>
                  <div class="meth-text">
                    <strong>ANOVA Variance</strong>
                    <span>Cross-platform price delta analysis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-footer">
          <div class="security-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span>Analysis computed in real-time based on selected date range.</span>
          </div>
          <button class="btn-save" (click)="closeStatsModal()">
            Close Analysis
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </aside>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .d-none { display: none !important; }
    .analytics-page {
      --bg: var(--main-bg);
      --card-bg: var(--panel-bg);
      --border: rgba(255, 255, 255, 0.08); /* Making borders clearer in white as requested */
      --text-main: var(--text-primary);
      --text-muted: var(--text-secondary);
      --accent: var(--accent-blue);
      display: block;
      width: 100%;
      background: var(--bg);
    }

    .analytics-page {
      padding: 32px;
      display: flex;
      flex-direction: column;
      gap: 32px;
      max-width: 1600px;
      margin: 0 auto;
    }

    /* VIEW TABS */
    .main-view-tabs { display: flex; gap: 32px; border-bottom: 1px solid var(--border); margin-bottom: -12px; padding-bottom: 0px; }
    .view-tab {
      background: none; border: none; font-size: 15px; font-weight: 600; color: var(--text-muted); cursor: pointer; padding: 0 0 16px 0; position: relative; transition: all 0.2s; display: flex; align-items: center; gap: 8px;
    }
    .view-tab svg { width: 18px; opacity: 0.7; }
    .view-tab:hover { color: var(--text-main); }
    .view-tab.active { color: var(--accent); }
    .view-tab.active svg { opacity: 1; }
    .view-tab.active::after { content: ''; position: absolute; bottom: -1px; left: 0; right: 0; height: 3px; background: var(--accent); border-radius: 3px 3px 0 0; }

    /* STANDARDIZED PANEL STYLES - Matching Overview Page */
    .panel-card { 
      background: var(--card-bg); 
      border: 1px solid var(--border); 
      border-radius: 20px; 
      display: flex; 
      flex-direction: column; 
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .panel-header { 
      padding: 24px 32px; 
      border-bottom: 1px solid var(--border); 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
    }
    .panel-header h3 { font-size: 16px; font-weight: 700; color: var(--text-main); margin: 0; }
    .panel-body { padding: 32px; }

    /* PAGE HEADER */
    .page-top { display: flex; justify-content: space-between; align-items: flex-end; padding-top: 24px; }
    .header-main h1 { font-size: 24px; font-weight: 800; color: var(--text-main); margin: 0 0 8px 0; letter-spacing: -0.02em; }
    .description { color: var(--text-muted); font-size: 15px; font-weight: 500; margin: 0; }

    .segmented-control { background: rgba(0,0,0,0.06); border-radius: 10px; padding: 4px; display: flex; gap: 2px; }
    :host-context(html:not(.light-mode)) .segmented-control { background: rgba(255,255,255,0.04); }
    .segmented-control button { border: none; background: transparent; color: var(--text-muted); padding: 8px 16px; border-radius: 7px; font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
    .segmented-control button.active { background: var(--card-bg); color: var(--text-main); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }

    .export-btn-premium { background: var(--accent); border: none; color: white; padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: 0.2s; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
    .export-btn-premium:hover { opacity: 0.9; transform: translateY(-1px); }
    .global-actions { display: flex; gap: 20px; align-items: center; }

    /* KPI HERO BANNER */
    .kpi-banner-wrap { width: 100%; }
    .kpi-grid-refined { 
       display: grid; 
       grid-template-columns: repeat(5, 1fr); 
       gap: 16px; 
    }
    .kpi-box-refined { 
       background: var(--card-bg); 
       border: 1px solid var(--border);
       padding: 24px; 
       border-radius: 20px;
       display: flex; 
       flex-direction: column; 
       gap: 16px; 
       transition: 0.2s; 
       box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .kpi-box-refined:hover { transform: translateY(-3px); border-color: var(--accent); }
    .kpi-box-refined .top-row { display: flex; justify-content: space-between; align-items: center; min-height: 24px; }
    .label-heading { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
    .delta-badge { font-size: 10px; font-weight: 800; padding: 2px 8px; border-radius: 6px; white-space: nowrap; }
    .value-main-row h2 { font-size: 28px; font-weight: 800; margin: 0; color: var(--text-main); letter-spacing: -0.03em; }
    .footer-row { display: flex; justify-content: space-between; align-items: center; }
    .comparison-text { font-size: 11px; font-weight: 600; }
    .mini-spark-container { width: 50px; height: 18px; position: relative; }

    /* REVENUE & MARGIN ENHANCEMENTS */
    .title-meta-stack { display: flex; flex-direction: column; gap: 12px; }
    .chart-summary-badges { display: flex; gap: 16px; align-items: center; }
    .s-badge { display: flex; flex-direction: column; gap: 2px; padding: 4px 16px; border-radius: 8px; border-left: 3px solid transparent; background: rgba(0,0,0,0.02); }
    :host-context(html:not(.light-mode)) .s-badge { background: rgba(255,255,255,0.03); }
    .s-badge.revenue { border-left-color: var(--accent); }
    .s-badge.margin { border-left-color: var(--success); }
    .s-label { font-size: 10px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .s-val { font-size: 15px; font-weight: 800; color: var(--text-main); }
    .professional-chart-wrap { position: relative; padding-top: 10px; }
    .panel-footer-legend { display: flex; gap: 24px; padding: 16px 32px; border-top: 1px solid var(--border); background: rgba(0,0,0,0.1); }
    .legend-pill { display: flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 700; color: var(--text-main); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .legend-line { width: 24px; height: 2px; border-radius: 1px; display: inline-block; }

    /* ANALYSIS LAYOUT GRID */
    .analysis-layout-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
    .view-mode-pill { display: flex; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: rgba(0,0,0,0.1); padding: 3px; gap: 2px; }
    .view-mode-pill button { border: none; background: transparent; color: var(--text-muted); padding: 6px 14px; font-size: 11px; font-weight: 700; cursor: pointer; transition: 0.2s; border-radius: 7px; }
    .view-mode-pill button.p-active { background: var(--accent); color: white; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3); }
    .chart-height-fixed { position: relative; height: 380px; }

    .donut-hero-container { position: relative; height: 180px; display: flex; justify-content: center; margin-bottom: 32px; }
    .donut-center-meta { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; }
    .center-val { display: block; font-size: 26px; font-weight: 900; color: var(--text-main); line-height: 1; }
    .center-sub { font-size: 10px; font-weight: 800; color: var(--text-muted); letter-spacing: 0.1em; margin-top: 4px; display: block; }

    .category-legend-stack { display: flex; flex-direction: column; gap: 10px; }
    .legend-item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; border-radius: 10px; background: rgba(0,0,0,0.02); }
    :host-context(html:not(.light-mode)) .legend-item-row { background: rgba(255,255,255,0.03); }
    .legend-key { display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 600; color: var(--text-main); }
    .legend-color-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-val { font-weight: 800; color: var(--text-main); font-size: 14px; }

    /* MARKET LEADERBOARD */
    .full-span-card { width: 100%; }
    .competitors-tiles-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
    .comp-tile-premium { 
       background: rgba(0,0,0,0.01); 
       border: 1px solid var(--border); 
       border-radius: 16px; 
       padding: 24px; 
       position: relative; 
       overflow: hidden; 
       display: flex;
       flex-direction: column;
       gap: 20px;
       transition: 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .comp-tile-premium:hover { transform: translateY(-4px); border-color: var(--accent); box-shadow: 0 12px 32px rgba(0,0,0,0.05); }
    .leader-gold-top { border-top: 3px solid #fbbf24; }
    .dim-rank-bg { 
       position: absolute; 
       right: -10px; 
       top: -10px; 
       font-size: 90px; 
       font-weight: 900; 
       opacity: 0.05; 
       pointer-events: none;
       line-height: 1;
       color: var(--text-main);
    }
    .comp-top-info { display: flex; align-items: center; gap: 14px; position: relative; z-index: 1; }
    .comp-avatar { 
       width: 44px; height: 44px; 
       background: var(--border); 
       border-radius: 10px; 
       display: flex; align-items: center; justify-content: center;
       font-weight: 900; color: var(--text-main);
    }
    .comp-brand-name { font-weight: 800; font-size: 15px; color: var(--text-main); }
    .comp-score-big { display: flex; flex-direction: column; position: relative; z-index: 1; }
    .score-group { display: flex; align-items: center; gap: 8px; }
    .val-num-bold { font-size: 36px; font-weight: 900; color: var(--text-main); letter-spacing: -0.04em; }
    .trend-indicator { font-size: 20px; font-weight: 700; }
    .score-cap { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .comp-stats-grid { display: flex; align-items: center; justify-content: space-between; position: relative; z-index: 1; padding: 12px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
    .m-stat { display: flex; flex-direction: column; }
    .m-label { font-size: 9px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
    .m-value { font-size: 13px; font-weight: 700; color: var(--text-main); margin-top: 2px; }
    .m-sep { width: 1px; height: 20px; background: var(--border); }
    .comp-foot-progress { margin-top: 4px; position: relative; z-index: 1; }
    .bar-track { width: 100%; height: 5px; background: var(--border); border-radius: 10px; overflow: hidden; }
    .bar-fill { height: 100%; transition: width 0.6s ease-out; }

    /* STATISTICAL CORRELATION */
    .correlation-view-split { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; }
    .section-title-box { margin-bottom: 32px; }
    .section-title-box h4 { font-size: 15px; font-weight: 700; color: var(--text-main); margin: 0; }
    .section-title-box p { font-size: 13px; color: var(--text-muted); margin: 6px 0 0 0; }
    
    .heatmap-grid-display { display: flex; flex-direction: column; gap: 6px; }
    .matrix-top-labels { display: flex; gap: 6px; margin-bottom: 8px; }
    .corner-pad { width: 60px; }
    .top-label { width: 56px; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; text-align: center; }
    .matrix-row-entry { display: flex; align-items: center; gap: 6px; }
    .side-label { width: 60px; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; text-align: right; margin-right: 8px; }
    .cell-strip { display: flex; gap: 6px; }
    .matrix-heat-cell { 
       width: 56px; height: 56px; 
       border-radius: 8px; 
       display: flex; align-items: center; justify-content: center; 
       font-size: 15px; font-weight: 800; color: white; cursor: default; 
    }
    .heatmap-key-scale { display: flex; align-items: center; gap: 16px; margin-top: 24px; padding: 0 10px; }
    .key-txt { font-size: 11px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
    .key-gradient { flex: 1; height: 8px; border-radius: 4px; background: linear-gradient(90deg, #EF4444, rgba(255,255,255,0.05), #3B82F6); }

    .insights-list-vertical { display: flex; flex-direction: column; gap: 12px; }
    .insight-row-modern { display: flex; align-items: flex-start; gap: 20px; padding: 18px 24px; border-radius: 12px; background: rgba(0,0,0,0.02); transition: 0.2s; }
    :host-context(html:not(.light-mode)) .insight-row-modern { background: rgba(255,255,255,0.02); }
    .insight-row-modern:hover { transform: translateX(8px); }
    .status-dot-lrg { width: 10px; height: 10px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 8px rgba(0,0,0,0.1); }
    .insight-meta-stack { display: flex; flex-direction: column; }
    .insight-heading-bold { font-size: 14px; font-weight: 700; color: var(--text-main); }
    .insight-detail-txt { font-size: 13px; color: var(--text-muted); margin-top: 6px; line-height: 1.5; }

    /* TABLE ANALYSIS */
    .table-container-scroll { width: 100%; border-radius: 0 0 16px 16px; overflow: hidden; }
    .data-table-premium { width: 100%; border-collapse: collapse; }
    .data-table-premium th { text-align: right; font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.12em; padding: 18px 32px; border-bottom: 2px solid var(--border); background: rgba(0,0,0,0.01); }
    .data-table-premium td { padding: 20px 32px; border-bottom: 1px solid var(--border); text-align: right; color: var(--text-main); font-size: 14px; font-weight: 600; }
    .data-table-premium tr:hover td { background: rgba(0,0,0,0.01); }
    .l-align { text-align: left !important; }
    .channel-identity { display: flex; align-items: center; gap: 14px; }
    .channel-avatar-box { width: 44px; height: 44px; background: var(--border); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900; color: var(--accent); }
    .channel-name-bold { font-weight: 800; font-size: 15px; }
    .win-chance-row { display: flex; justify-content: flex-end; align-items: center; gap: 12px; }
    .chance-track-base { width: 80px; height: 6px; background: var(--border); border-radius: 10px; overflow: hidden; }
    .chance-fill-active { height: 100%; }
    .share-distribution-row { display: flex; align-items: center; gap: 14px; justify-content: flex-end; }
    .distribution-track-wide { width: 140px; height: 8px; background: var(--border); border-radius: 10px; overflow: hidden; }
    .distribution-fill-wide { height: 100%; border-radius: 10px; transition: 1s cubic-bezier(0.16, 1, 0.3, 1); }
    .spark-table-wrap { position: relative; width: 80px; height: 32px; float: right; }
    .canvas-spark-table { width: 80px; height: 32px; }

    /* VELOCITY LEADERS */
    .velocity-stack-compact { display: flex; flex-direction: column; }
    .product-row-velocity { display: flex; align-items: center; gap: 20px; padding: 18px 32px; border-bottom: 1px solid var(--border); transition: 0.2s; }
    .product-row-velocity:hover { background: rgba(0,0,0,0.01); }
    .velocity-rank-pill { width: 28px; height: 28px; font-size: 13px; font-weight: 900; color: var(--text-muted); opacity: 0.4; }
    .product-char-avatar { width: 44px; height: 44px; background: var(--border); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-main); flex-shrink: 0; }
    .product-info-column { flex: 1; display: flex; flex-direction: column; text-align: left; }
    .p-name-main { font-size: 14px; font-weight: 700; color: var(--text-main); line-height: 1.3; }
    .p-cat-sub { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.04em; margin-top: 4px; }
    .product-stats-group-end { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; margin-left: auto; }
    .p-rev-val { font-weight: 800; font-size: 16px; color: var(--text-main); }
    .p-mgn-pill-label { font-size: 11px; font-weight: 800; padding: 3px 10px; border-radius: 12px; }
    .p-mgn-pill-label.high { background: rgba(16, 185, 129, 0.1); color: #10B981; }
    .p-mgn-pill-label.mid { background: rgba(245, 158, 11, 0.1); color: #F59E0B; }
    .p-mgn-pill-label.low { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
    .p-spark-wrap-end { width: 100px; height: 36px; position: relative; margin-left: 20px; }
    .canvas-spark-sku { width: 100px; height: 36px; }

    /* STATISTICAL SIGNIFICANCE */
    .two-column-bottom-section { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; }
    .stats-ico { width: 22px; height: 22px; color: var(--accent); }
    .stats-header-group { display: flex; align-items: center; gap: 14px; }
    .stats-feed-vertical { display: flex; flex-direction: column; gap: 1px; background: var(--border); margin: -1px; }
    .stats-card-insight { background: var(--card-bg); padding: 24px 32px; border-left: 4px solid transparent; transition: 0.2s; }
    .stats-card-insight:hover { background: rgba(37, 99, 235, 0.02); }
    .stats-card-meta-top { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .stats-title-txt-bold { font-weight: 800; font-size: 15px; color: var(--text-main); }
    .stats-time-label-muted { font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
    .stats-detail-txt-muted { font-size: 13px; line-height: 1.7; color: var(--text-muted); margin: 0 0 20px 0; }
    .btn-action-outline { background: transparent; border: 1px solid var(--border); color: var(--text-main); padding: 8px 18px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; transition: 0.2s; }
    .btn-action-outline:hover { background: var(--text-main); color: var(--card-bg); border-color: var(--text-main); }

    .link-btn-text { background: none; border: none; color: var(--accent); font-size: 14px; font-weight: 700; cursor: pointer; }
    .txt-tiny { font-size: 11px; font-weight: 700; }

    /* DRAWER STYLES */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); z-index: 2000; }
    :host-context(html:not(.light-mode)) .drawer-overlay { background: rgba(0,0,0,0.7); }

    .stats-drawer { 
      position: fixed; top: 0; right: 0; bottom: 0; 
      width: 500px; background: #0a0a0c; border-left: 1px solid var(--border);
      z-index: 2001; display: flex; flex-direction: column;
      box-shadow: -20px 0 80px rgba(0,0,0,0.6);
    }
    :host-context(html.light-mode) .stats-drawer { background: #ffffff; border-left: 1px solid #e5e7eb; }

    .drawer-header {
      padding: 32px; border-bottom: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: flex-start;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, transparent 100%);
    }
    :host-context(html.light-mode) .drawer-header { border-bottom: 1px solid #e5e7eb; }
    .header-left { display: flex; align-items: center; gap: 20px; }
    .icon-circle { width: 44px; height: 44px; border-radius: 12px; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(37, 99, 235, 0.2); svg { width: 22px; } }
    .drawer-header h3 { font-size: 20px; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.02em; }
    .drawer-header p { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin: 4px 0 0; }
    
    .close-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: rgba(255,255,255,0.03); color: var(--text-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; &:hover { background: rgba(255,255,255,0.08); color: var(--text-main); } svg { width: 16px; } }

    .drawer-body { padding: 32px; display: flex; flex-direction: column; gap: 24px; overflow-y: auto; flex: 1; }
    .section-label { font-size: 11px; font-weight: 850; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 12px; }
    
    .stats-premium-grid { display: flex; flex-direction: column; gap: 24px; }
    .stats-summary-hero-modern { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .hero-metric-pill { background: #16161a; border: 1px solid var(--border); border-left: 4px solid var(--accent); padding: 16px; border-radius: 12px; display: flex; flex-direction: column; gap: 4px; }
    :host-context(html.light-mode) .hero-metric-pill { background: #f9fafb; border-color: #e5e7eb; }
    .hero-metric-pill .m-label { font-size: 9px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; }
    .hero-metric-pill .m-val { font-size: 15px; font-weight: 800; color: var(--text-main); }

    .detail-content-block-refined { display: flex; flex-direction: column; gap: 20px; }
    .stats-description-lrg { font-size: 14px; color: var(--text-main); line-height: 1.6; margin: 0; font-weight: 500; }
    
    .variance-chart-container { background: #111114; border: 1px solid var(--border); border-radius: 16px; padding: 20px; position: relative; height: 220px; }
    :host-context(html.light-mode) .variance-chart-container { background: #ffffff; border-color: #e5e7eb; }
    .chart-header-row { margin-bottom: 16px; }
    .c-title { font-size: 11px; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .modal-variance-canvas { width: 100% !important; height: 140px !important; }

    .stats-methodology-box { padding: 16px; background: #16161a; border: 1px solid var(--border); border-radius: 12px; }
    :host-context(html.light-mode) .stats-methodology-box { background: #f9fafb; border-color: #e5e7eb; }
    .method-item { display: flex; gap: 14px; align-items: center; }
    .meth-icon { font-size: 20px; color: var(--accent); font-weight: 800; }
    .meth-text { display: flex; flex-direction: column; gap: 2px; }
    .meth-text strong { font-size: 13px; font-weight: 700; color: var(--text-main); }
    .meth-text span { font-size: 11px; color: var(--text-muted); font-weight: 600; }

    .drawer-footer { padding: 32px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 20px; }
    .security-note { display: flex; gap: 10px; font-size: 12px; font-weight: 500; color: var(--text-muted); align-items: center; background: #16161a; padding: 12px 16px; border-radius: 12px; }
    :host-context(html.light-mode) .security-note { background: #f9fafb; border: 1px solid #e5e7eb; }
    .security-note svg { width: 14px; color: var(--accent); }
    
    .btn-save {
      width: 100%; height: 56px; background: var(--accent); color: white; border: none; border-radius: 14px;
      font-size: 15px; font-weight: 800; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 12px;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2); transition: all 0.3s;
    }
    .btn-save:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3); filter: brightness(1.1); }
    .btn-save svg { width: 18px; transition: transform 0.2s; }
    .btn-save:hover svg { transform: translateX(4px); }

    @media (max-width: 1400px) { .analysis-layout-grid, .two-column-bottom-section, .correlation-view-split, .competitors-tiles-row { grid-template-columns: 1fr; } .kpi-grid-refined { grid-template-columns: repeat(3, 1fr); } }
  `],
})
export class BusinessAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('revenueMarginCanvas') revenueMarginCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('avgPriceCategoryCanvas') avgPriceCategoryCanvas!: ElementRef<HTMLCanvasElement>;
  
  @ViewChildren('sparklineCanvas') sparklineCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('tableTrendCanvas') tableTrendCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  @ViewChildren('skuTrendCanvas') skuTrendCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;

  activeTab: 'market' | 'products' = 'market';
  chartInstances: Chart[] = [];
  
  setTab(tab: 'market' | 'products') {
    this.activeTab = tab;
  }

  viewMode: 'Revenue' | 'Margin' | 'Both' = 'Both';
  activeRange = '30D';
  dateRanges = ['7D', '30D', '90D', '12M', 'Custom'];

  kpis: KPI[] = [
    { label: 'Total Revenue', value: '$284,920', delta: '+12.4%', isPositive: true, color: '#10B981', trend: [30, 45, 38, 52, 48, 65, 78] },
    { label: 'Avg. Margin', value: '34.2%', delta: '-1.8%', isPositive: false, color: '#F59E0B', trend: [40, 38, 39, 35, 36, 34, 34] },
    { label: 'Total Products', value: '487', delta: '+23', isPositive: true, color: '#3B82F6', trend: [400, 410, 425, 430, 450, 470, 487] },
    { label: 'Win Rate', value: '68.4%', delta: '+4.2%', isPositive: true, color: '#10B981', trend: [60, 62, 61, 65, 64, 67, 68] },
    { label: 'Market Vol', value: '142', delta: 'High', isPositive: false, color: '#EF4444', trend: [110, 130, 95, 150, 140, 160, 142] }
  ];

  categoryPricing = [
    { category: 'Electronics', avgPrice: 842.00, color: '#2563EB' },
    { category: 'Périphériques', avgPrice: 1240.00, color: '#8B5CF6' },
    { category: 'Audio', avgPrice: 299.00, color: '#10B981' },
    { category: 'Tablets', avgPrice: 650.00, color: '#F59E0B' },
    { category: 'Other', avgPrice: 120.00, color: '#94A3B8' }
  ];

  productLabels = ['Prc', 'Vol', 'Mgn', 'Win', 'Pos'];
  correlationData = [
    [1.0, 0.82, -0.4, 0.95, 0.12],
    [0.82, 1.0, 0.15, 0.76, -0.1],
    [-0.4, 0.15, 1.0, -0.22, 0.05],
    [0.95, 0.76, -0.22, 1.0, -0.3],
    [0.12, -0.1, 0.05, -0.3, 1.0]
  ];

  correlationInsights = [
    { label: 'Price ↔ Volume', explanation: 'Current elasticity suggests higher prices reduce volume by ~18% in electronics.', color: '#3B82F6' },
    { label: 'Margin ↔ Win Rate', explanation: 'Maintaining competitive margins correlates with +12% win rate on Amazon.', color: '#10B981' },
    { label: 'Volume ↔ Margin', explanation: 'High-velocity SKUs currently operate at 8% lower than average margins.', color: '#F87171' },
    { label: 'Win Rate ↔ Position', explanation: 'Organic search rank 1-3 significantly boosts win rate probability by 40%.', color: '#3B82F6' }
  ];

  competitorRanks: CompetitorRank[] = [
    { name: 'BestBuy Global', score: 942, winRate: 74, avgPrice: 842, skus: 124, trend: 'up', color: '#fbbf24' },
    { name: 'Amazon Warehouse', score: 885, winRate: 42, avgPrice: 855, skus: 412, trend: 'stable', color: '#3b82f6' },
    { name: 'Walmart Inc', score: 812, winRate: 61, avgPrice: 838, skus: 288, trend: 'down', color: '#f59e0b' },
    { name: 'ElectroHub Retail', score: 760, winRate: 55, avgPrice: 799, skus: 95, trend: 'up', color: '#64748b' }
  ];

  platformStats: PlatformStat[] = [
    { name: 'BestBuy', logo: '', items: 342, avgPrice: 842.20, winRate: 74, revenueShare: 45, trend: [65, 68, 70, 72, 74, 73, 74] },
    { name: 'Amazon', logo: '', items: 412, avgPrice: 855.40, winRate: 42, revenueShare: 32, trend: [40, 41, 40, 42, 43, 41, 42] },
    { name: 'Walmart', logo: '', items: 288, avgPrice: 838.00, winRate: 61, revenueShare: 23, trend: [58, 59, 60, 61, 60, 62, 61] }
  ];

  topProducts: Product[] = [
    { name: 'Keychron Q1 Max Custom Keyboard', revenue: 42500, margin: 24, image: '', history: [40, 42, 45, 43, 48, 52, 55] },
    { name: 'Apple iPad Pro 12.9" M2', revenue: 38200, margin: 18, image: '', history: [35, 36, 38, 37, 39, 40, 38] },
    { name: 'Bose Ultra Headphones', revenue: 29400, margin: 32, image: '', history: [22, 25, 24, 28, 30, 32, 31] },
    { name: 'Nintendo Switch OLED', revenue: 24100, margin: 12, image: '', history: [18, 19, 21, 20, 22, 23, 24] },
    { name: 'Logitech Master 3S', revenue: 18600, margin: 45, image: '', history: [12, 14, 15, 17, 18, 19, 20] }
  ];

  insights: Insight[] = [
    { type: 'win', title: 'Market Stability Index', message: 'Current price fluctuations are within 95% confidence intervals, indicating statistically significant stability across major categories.', timeAgo: 'LATEST' },
    { type: 'risk', title: 'Sample Size Variance', message: 'The current SKU overlap on Walmart (p=0.08) is below the significance threshold, suggesting trend data may be speculative this period.', timeAgo: 'LATEST' }
  ];

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {}
  ngAfterViewInit() { Promise.resolve().then(() => this.initAllCharts()); }
  ngOnDestroy() { this.chartInstances.forEach(c => c.destroy()); }

  private initAllCharts() {
    const isLight = document.documentElement.classList.contains('light-mode');
    Chart.defaults.color = isLight ? '#64748B' : 'rgba(255, 255, 255, 0.77)'; 
    Chart.defaults.font.family = "'Inter', sans-serif";
    Chart.defaults.font.size = 11;
    
    const borderCol = isLight ? '#E2E8F0' : '#1E293B';
    const gridColor = isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';

    this.chartInstances.forEach(c => { try { c.destroy(); } catch(e) {} });
    this.chartInstances = [];

    this.createRevenueMarginChart(gridColor, borderCol);
    this.createAvgPriceCategoryChart();
    this.createKpiSparklines();
    this.createTableVisuals('#10B981');
    if (this.showStatsModal) this.createModalChart();
  }

  private createModalChart() {
    if (!this.modalVarianceCanvas) return;
    const ctx = this.modalVarianceCanvas.nativeElement.getContext('2d')!;
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-blue') || '#3B82F6';
    
    this.chartInstances.push(new Chart(ctx, {
      type: 'line',
      data: {
        labels: Array.from({length: 40}, (_, i) => i),
        datasets: [{
          data: Array.from({length: 40}, (_, i) => Math.exp(-Math.pow(i - 20, 2) / 40) * 100),
          borderColor: accent,
          borderWidth: 3,
          fill: true,
          backgroundColor: accent + '15',
          tension: 0.4,
          pointRadius: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: { x: { display: false }, y: { display: false } }
      }
    }));
  }

  @ViewChild('modalVarianceCanvas') set modalCanvas(content: ElementRef) {
    if (content) {
      this.modalVarianceCanvas = content;
      // Small timeout to ensure canvas is ready
      setTimeout(() => this.createModalChart(), 50);
    }
  }
  private modalVarianceCanvas!: ElementRef<HTMLCanvasElement>;

  private createRevenueMarginChart(gridColor: string, borderCol: string) {
    const ctx = this.revenueMarginCanvas.nativeElement.getContext('2d')!;
    
    // Multi-layered Gradient for Revenue Bars
    const revGradient = ctx.createLinearGradient(0, 0, 0, 400);
    revGradient.addColorStop(0, 'rgba(37, 99, 235, 0.7)');
    revGradient.addColorStop(0.5, 'rgba(37, 99, 235, 0.4)');
    revGradient.addColorStop(1, 'rgba(37, 99, 235, 0.1)');

    this.chartInstances.push(new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Array.from({length: 30}, (_, i) => `Mar ${i + 1}`),
        datasets: [
          {
            type: 'bar',
            label: 'Revenue',
            data: Array.from({length: 30}, () => 7000 + Math.random() * 3000),
            backgroundColor: revGradient,
            borderRadius: { topLeft: 5, topRight: 5, bottomLeft: 0, bottomRight: 0 },
            borderSkipped: false,
            barThickness: 14,
            yAxisID: 'y',
            hidden: this.viewMode === 'Margin'
          },
          {
            type: 'line',
            label: 'Margin %',
            data: Array.from({length: 30}, () => 32 + Math.random() * 8),
            borderColor: '#10B981',
            borderWidth: 3,
            tension: 0.45,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#10B981',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            yAxisID: 'y1',
            hidden: this.viewMode === 'Revenue'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            cornerRadius: 10,
            displayColors: true,
            callbacks: {
              label: (context: any) => {
                let label = context.dataset.label || '';
                const val = context.parsed.y;
                if (val === null || val === undefined) return ` ${label}: -`;
                if (label === 'Revenue') return ` ${label}: $${val.toLocaleString()}`;
                return ` ${label}: ${val.toFixed(1)}%`;
              }
            }
          }
        },
        scales: {
          x: { 
            grid: { display: false },
            ticks: { autoSkip: true, maxTicksLimit: 10, font: { weight: 600 } }
          },
          y: { 
            position: 'left',
            grid: { color: gridColor, drawTicks: false },
            border: { display: false, dash: [4, 4] },
            ticks: { 
              padding: 12,
              callback: v => `$${Number(v) >= 1000 ? (Number(v)/1000).toFixed(0) + 'k' : v}` 
            } 
          },
          y1: { 
            position: 'right',
            grid: { display: false },
            ticks: { 
              padding: 12,
              callback: v => v + '%' 
            } 
          }
        }
      }
    }));
  }

  private createAvgPriceCategoryChart() {
    this.chartInstances.push(new Chart(this.avgPriceCategoryCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.categoryPricing.map(c => c.category),
        datasets: [{ data: this.categoryPricing.map(c => c.avgPrice), backgroundColor: this.categoryPricing.map(c => c.color), borderWidth: 0 }]
      },
      options: { cutout: '82%', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    }));
  }

  private createKpiSparklines() {
    this.sparklineCanvases.forEach((c, i) => this.createMiniSpark(c.nativeElement, this.kpis[i].trend, this.kpis[i].color));
  }

  private createTableVisuals(color: string) {
    this.tableTrendCanvases.forEach((c, i) => this.createMiniSpark(c.nativeElement, this.platformStats[i].trend, color));
    this.skuTrendCanvases.forEach((c, i) => this.createMiniSpark(c.nativeElement, this.topProducts[i].history, '#10B981'));
  }

  private createMiniSpark(canvas: HTMLCanvasElement, data: number[], color: string) {
    this.chartInstances.push(new Chart(canvas, {
      type: 'line',
      data: { labels: data.map((_, i) => i), datasets: [{ data,borderColor: color, borderWidth: 2, pointRadius: 0, fill: false, tension: 0.45 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } } }
    }));
  }

  getCorrelationColor(val: number) {
    if (val === 1) return '#3B82F6';
    if (val >= 0.8) return 'rgba(59, 130, 246, 0.75)';
    if (val >= 0.5) return 'rgba(59, 130, 246, 0.45)';
    if (val >= 0) return 'rgba(148, 163, 184, 0.1)';
    if (val >= -0.3) return 'rgba(239, 68, 68, 0.35)';
    return '#EF4444';
  }

  getPlatformColor(name: string) {
    const n = name.toLowerCase();
    if (n.includes('amazon')) return '#F97316';
    if (n.includes('bestbuy')) return '#2563EB';
    if (n.includes('walmart')) return '#FACC15';
    return '#3B82F6';
  }

  updateViewMode(mode: 'Revenue' | 'Margin' | 'Both') { this.viewMode = mode; this.initAllCharts(); }
  
  onRangeChange(range: string) {
    this.activeRange = range;
    // simulating a data re-fetch for the new time window
    this.initAllCharts();
    console.log(`Switched data view to: ${range}`);
  }

  isGeneratingReport = false;
  downloadReport() {
    this.isGeneratingReport = true;
    // simulating a PDF generation/download process
    setTimeout(() => {
       this.isGeneratingReport = false;
       alert('Full High-Resolution Analytics PDF Report has been generated and is downloading.');
    }, 1500);
  }

  getWinRateColorByValue(val: number) { return val >= 70 ? '#10B981' : (val >= 50 ? '#F59E0B' : '#EF4444'); }
  getMarginClass(val: number) { return val >= 30 ? 'high' : (val >= 15 ? 'mid' : 'low'); }
  getInsightColor(type: string) { return type === 'win' ? '#10B981' : (type === 'risk' ? '#EF4444' : '#F59E0B'); }

  selectedInsight: Insight | null = null;
  showStatsModal = false;

  showStatsDetail(insight: Insight) {
    this.selectedInsight = insight;
    this.showStatsModal = true;
    console.log('Detailed Stats Modal opened for:', insight);
  }

  closeStatsModal() {
    this.showStatsModal = false;
    this.selectedInsight = null;
  }
}
