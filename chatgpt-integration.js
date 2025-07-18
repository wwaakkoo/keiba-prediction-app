#!/usr/bin/env node

/**
 * ChatGPT連携用のHTTP APIサーバー
 * MCPサーバーの機能をHTTP APIとして公開
 */

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// MCPサーバーの機能をHTTP APIとして公開
app.post('/api/horse-race-analysis', async (req, res) => {
  try {
    const { horses, raceInfo, analysisType } = req.body;
    
    // 競馬予想分析の実行
    const result = await executeHorseRaceAnalysis(horses, raceInfo, analysisType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/kelly-betting', async (req, res) => {
  try {
    const { horses, bankroll, riskLevel } = req.body;
    
    // ケリー基準計算の実行
    const result = await executeKellyBetting(horses, bankroll, riskLevel);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/recommendations', async (req, res) => {
  try {
    const { predictions, strategy } = req.body;
    
    // 推奨システムの実行
    const result = await executeRecommendations(predictions, strategy);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/performance-analysis', async (req, res) => {
  try {
    const { history, analysisType } = req.body;
    
    // パフォーマンス分析の実行
    const result = await executePerformanceAnalysis(history, analysisType);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ヘルスチェック用エンドポイント
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      horseRaceAnalysis: 'available',
      kellyBetting: 'available',
      recommendations: 'available',
      performanceAnalysis: 'available'
    }
  });
});

// 利用可能なAPI一覧
app.get('/api/endpoints', (req, res) => {
  res.json({
    endpoints: [
      {
        path: '/api/horse-race-analysis',
        method: 'POST',
        description: '競馬予想分析',
        parameters: {
          horses: 'Array of horse objects',
          raceInfo: 'Race information object',
          analysisType: 'Analysis type (standard/enhanced/ai_integrated)'
        }
      },
      {
        path: '/api/kelly-betting',
        method: 'POST',
        description: 'ケリー基準資金管理',
        parameters: {
          horses: 'Array of horse objects with win probabilities',
          bankroll: 'Total bankroll amount',
          riskLevel: 'Risk level (conservative/moderate/aggressive)'
        }
      },
      {
        path: '/api/recommendations',
        method: 'POST',
        description: '推奨システム',
        parameters: {
          predictions: 'Array of prediction objects',
          strategy: 'Strategy type (conservative/balanced/aggressive)'
        }
      },
      {
        path: '/api/performance-analysis',
        method: 'POST',
        description: 'パフォーマンス分析',
        parameters: {
          history: 'Array of betting history objects',
          analysisType: 'Analysis type (win_rate/roi/consistency/comprehensive)'
        }
      }
    ]
  });
});

// 実装関数（MCPサーバーの機能を利用）
async function executeHorseRaceAnalysis(horses, raceInfo, analysisType = 'standard') {
  // 基本的な競馬予想分析
  const analysisResults = horses.map(horse => {
    const odds = parseFloat(horse.odds) || 5.0;
    const winProbability = calculateWinProbability(horse, odds);
    const placeProbability = calculatePlaceProbability(horse, odds);
    const expectedValue = winProbability * odds - 1;
    
    return {
      name: horse.name,
      odds: odds,
      winProbability: winProbability,
      placeProbability: placeProbability,
      expectedValue: expectedValue,
      recommendation: getRecommendation(winProbability, expectedValue)
    };
  });

  analysisResults.sort((a, b) => b.expectedValue - a.expectedValue);

  return {
    timestamp: new Date().toISOString(),
    analysisType: analysisType,
    raceInfo: raceInfo || {},
    totalHorses: horses.length,
    predictions: analysisResults,
    topPicks: analysisResults.slice(0, 3)
  };
}

async function executeKellyBetting(horses, bankroll, riskLevel = 'moderate') {
  const kellyResults = horses.map(horse => {
    const odds = parseFloat(horse.odds) || 5.0;
    const winProbability = horse.winProbability || calculateWinProbability(horse, odds);
    const netOdds = odds - 1;
    
    const kellyFraction = Math.max(0, (netOdds * winProbability - (1 - winProbability)) / netOdds);
    
    const riskAdjustment = {
      conservative: 0.5,
      moderate: 0.75,
      aggressive: 1.0
    }[riskLevel] || 0.75;
    
    const adjustedKellyFraction = kellyFraction * riskAdjustment;
    const optimalBetSize = Math.min(
      Math.max(adjustedKellyFraction * bankroll, 1000),
      50000
    );
    
    return {
      name: horse.name,
      odds: odds,
      winProbability: winProbability,
      kellyFraction: kellyFraction,
      adjustedKellyFraction: adjustedKellyFraction,
      optimalBetSize: Math.round(optimalBetSize),
      expectedValue: winProbability * odds - 1
    };
  });

  kellyResults.sort((a, b) => b.adjustedKellyFraction - a.adjustedKellyFraction);

  return {
    timestamp: new Date().toISOString(),
    bankroll: bankroll,
    riskLevel: riskLevel,
    kellyResults: kellyResults
  };
}

async function executeRecommendations(predictions, strategy = 'balanced') {
  const recommendations = predictions.map(pred => {
    let confidence = 0;
    
    confidence += Math.min(pred.winProbability * 2.5, 50);
    
    if (pred.expectedValue > 1.2) confidence += 10;
    else if (pred.expectedValue > 1.0) confidence += 5;
    else if (pred.expectedValue < 0.8) confidence -= 5;
    
    if (pred.confidence > 0.8) confidence += 10;
    else if (pred.confidence > 0.6) confidence += 5;
    else if (pred.confidence < 0.4) confidence -= 5;
    
    confidence = Math.min(Math.max(confidence, 0), 100);
    
    return {
      horseName: pred.horseName,
      confidence: confidence,
      winProbability: pred.winProbability,
      expectedValue: pred.expectedValue,
      confidenceLevel: getConfidenceLevel(confidence)
    };
  });

  recommendations.sort((a, b) => b.confidence - a.confidence);

  return {
    timestamp: new Date().toISOString(),
    strategy: strategy,
    recommendations: recommendations
  };
}

async function executePerformanceAnalysis(history, analysisType = 'comprehensive') {
  const totalBet = history.reduce((sum, h) => sum + h.betAmount, 0);
  const totalPayout = history.reduce((sum, h) => sum + h.payout, 0);
  const wins = history.filter(h => h.result === 'win').length;
  
  const analysis = {
    winRate: wins / history.length,
    roi: (totalPayout - totalBet) / totalBet,
    totalBet: totalBet,
    totalPayout: totalPayout,
    profit: totalPayout - totalBet
  };

  return {
    timestamp: new Date().toISOString(),
    analysisType: analysisType,
    performance: analysis,
    period: {
      start: history[0]?.date,
      end: history[history.length - 1]?.date,
      totalBets: history.length
    }
  };
}

// ヘルパー関数
function calculateWinProbability(horse, odds) {
  const marketProbability = 1 / odds;
  const adjustedProbability = marketProbability * 0.8;
  return Math.min(Math.max(adjustedProbability, 0.01), 0.9);
}

function calculatePlaceProbability(horse, odds) {
  const winProbability = calculateWinProbability(horse, odds);
  return Math.min(winProbability * 2.5, 0.95);
}

function getRecommendation(winProbability, expectedValue) {
  if (expectedValue > 0.2) return '強推奨';
  if (expectedValue > 0.1) return '推奨';
  if (expectedValue > 0) return '注目';
  return '非推奨';
}

function getConfidenceLevel(confidence) {
  if (confidence >= 75) return '最有力';
  if (confidence >= 60) return '有力';
  if (confidence >= 45) return '注目';
  if (confidence >= 30) return '警戒';
  return '穴';
}

// サーバー起動
app.listen(port, () => {
  console.log(`🏇 競馬予想アプリ HTTP API サーバーが起動しました`);
  console.log(`📡 ポート: ${port}`);
  console.log(`🔗 API エンドポイント: http://localhost:${port}/api`);
  console.log(`📊 ヘルスチェック: http://localhost:${port}/api/health`);
  console.log(`📋 利用可能API: http://localhost:${port}/api/endpoints`);
  console.log('');
  console.log('🤖 ChatGPTでの利用例:');
  console.log('「http://localhost:3001/api/horse-race-analysis に以下のデータをPOSTしてください」');
});

export default app;