import React from 'react';
import { BarChart3, PieChart, TrendingUp, Sparkles } from 'lucide-react';
import { genres } from './genres';

export default function Analytics({ storyHistory, setCurrentView }) {
  // Calculate analytics data
  const totalStories = storyHistory.length;
  const storiesWithImages = storyHistory.filter(s => s.image).length;
  const storiesWithAudio = storyHistory.filter(s => s.hasAudio === 'Yes').length;
  
  const genreCounts = {};
  genres.forEach(g => genreCounts[g.id] = 0);
  storyHistory.forEach(s => {
    if (genreCounts[s.genre] !== undefined) {
      genreCounts[s.genre]++;
    }
  });

  const sortedGenres = Object.entries(genreCounts)
    .map(([id, count]) => ({
      ...genres.find(g => g.id === id),
      count
    }))
    .sort((a, b) => b.count - a.count);

  const totalWords = storyHistory.reduce((sum, s) => sum + (s.story ? s.story.split(' ').length : 0), 0);
  const avgWords = totalStories > 0 ? Math.round(totalWords / totalStories) : 0;

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      background: 'white',
      borderRadius: '20px',
      padding: '2.5rem',
      boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
    }}>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: '700',
        color: '#8b5cf6',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <BarChart3 size={32} />
        📊 Story Analytics Dashboard
      </h2>

      {storyHistory.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: '#f9fafb',
          borderRadius: '16px',
          border: '2px dashed #d1d5db'
        }}>
          <BarChart3 size={64} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>No Stories Yet</p>
          <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>Create your first story to see analytics!</p>
          <button
            onClick={() => setCurrentView('home')}
            style={{
              marginTop: '1.5rem',
              padding: '0.875rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={20} />
            Start Creating Stories
          </button>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Total Stories</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{totalStories}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Stories with Images</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{storiesWithImages}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Stories with Audio</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{storiesWithAudio}</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '16px',
              boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)'
            }}>
              <div style={{ fontSize: '0.875rem', opacity: 0.9, marginBottom: '0.5rem' }}>Avg Words/Story</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800' }}>{avgWords}</div>
            </div>
          </div>

          {/* Genre Statistics with Donut Chart */}
          <div style={{
            background: '#f9fafb',
            padding: '2rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            border: '2px solid #e5e7eb'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <PieChart size={24} />
              Stories by Genre
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '2rem',
              alignItems: 'center'
            }}>
              {/* Donut Chart */}
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto'
              }}>
                <svg viewBox="0 0 240 240" style={{ width: '100%', height: 'auto' }}>
                  <defs>
                    {sortedGenres.map((genre, index) => (
                      <linearGradient key={genre.id} id={`gradient-${genre.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={genre.color} />
                        <stop offset="100%" stopColor={`${genre.color}dd`} />
                      </linearGradient>
                    ))}
                  </defs>
                  
                  {/* Donut segments */}
                  {(() => {
                    let currentAngle = 0;
                    return sortedGenres.map((genre, index) => {
                      const percentage = totalStories > 0 ? (genre.count / totalStories) : 0;
                      const angle = percentage * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + angle;
                      const midAngle = (startAngle + endAngle) / 2;
                      currentAngle = endAngle;
                      
                      if (genre.count === 0) return null;
                      
                      const startRad = (startAngle - 90) * Math.PI / 180;
                      const endRad = (endAngle - 90) * Math.PI / 180;
                      const midRad = (midAngle - 90) * Math.PI / 180;
                      
                      const outerRadius = 85;
                      const innerRadius = 55;
                      const labelRadius = 100;
                      
                      const x1Outer = 120 + outerRadius * Math.cos(startRad);
                      const y1Outer = 120 + outerRadius * Math.sin(startRad);
                      const x2Outer = 120 + outerRadius * Math.cos(endRad);
                      const y2Outer = 120 + outerRadius * Math.sin(endRad);
                      
                      const x1Inner = 120 + innerRadius * Math.cos(endRad);
                      const y1Inner = 120 + innerRadius * Math.sin(endRad);
                      const x2Inner = 120 + innerRadius * Math.cos(startRad);
                      const y2Inner = 120 + innerRadius * Math.sin(startRad);
                      
                      const labelX = 120 + labelRadius * Math.cos(midRad);
                      const labelY = 120 + labelRadius * Math.sin(midRad);
                      
                      const largeArc = angle > 180 ? 1 : 0;
                      
                      const path = `
                        M ${x1Outer} ${y1Outer}
                        A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}
                        L ${x1Inner} ${y1Inner}
                        A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}
                        Z
                      `;
                      
                      return (
                        <g key={genre.id}>
                          <path
                            d={path}
                            fill={`url(#gradient-${genre.id})`}
                            stroke="white"
                            strokeWidth="2"
                            style={{
                              transition: 'all 0.3s ease',
                              cursor: 'pointer'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.opacity = '0.8';
                              e.target.style.filter = 'brightness(1.1)';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.opacity = '1';
                              e.target.style.filter = 'brightness(1)';
                            }}
                          />
                          {/* Percentage label around the circle */}
                          {percentage > 0.05 && (
                            <text
                              x={labelX}
                              y={labelY}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fontSize="13"
                              fontWeight="700"
                              fill={genre.color}
                              style={{
                                textShadow: '0 0 3px white, 0 0 3px white, 0 0 3px white',
                                paintOrder: 'stroke',
                                stroke: 'white',
                                strokeWidth: '3px',
                                strokeLinejoin: 'round'
                              }}
                            >
                              {(percentage * 100).toFixed(0)}%
                            </text>
                          )}
                        </g>
                      );
                    });
                  })()}
                  
                  {/* Center circle with total */}
                  <circle cx="120" cy="120" r="50" fill="white" />
                  <text 
                    x="120" 
                    y="115" 
                    textAnchor="middle" 
                    fontSize="28" 
                    fontWeight="800" 
                    fill="#374151"
                  >
                    {totalStories}
                  </text>
                  <text 
                    x="120" 
                    y="130" 
                    textAnchor="middle" 
                    fontSize="12" 
                    fontWeight="600"
                    fill="#6b7280"
                  >
                    Total Stories
                  </text>
                </svg>
              </div>

              {/* Legend with percentages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {sortedGenres.map(genre => {
                  const Icon = genre.icon;
                  const percentage = totalStories > 0 ? ((genre.count / totalStories) * 100).toFixed(1) : 0;
                  
                  return (
                    <div 
                      key={genre.id} 
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'white',
                        borderRadius: '10px',
                        border: `2px solid ${genre.color}30`,
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = genre.color;
                        e.currentTarget.style.transform = 'translateX(5px)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${genre.color}40`;
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = `${genre.color}30`;
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          background: `linear-gradient(135deg, ${genre.color}, ${genre.color}dd)`
                        }} />
                        <Icon size={18} color={genre.color} />
                        <span style={{ fontWeight: '600', color: '#374151', fontSize: '0.95rem' }}>
                          {genre.name}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ 
                          fontWeight: '800', 
                          color: genre.color, 
                          fontSize: '1.1rem',
                          minWidth: '30px',
                          textAlign: 'right'
                        }}>
                          {genre.count}
                        </span>
                        <span style={{ 
                          fontSize: '0.85rem', 
                          color: '#6b7280',
                          fontWeight: '600',
                          minWidth: '50px',
                          textAlign: 'right'
                        }}>
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Story Creation Timeline */}
          <div style={{
            background: '#f9fafb',
            padding: '2rem',
            borderRadius: '16px',
            border: '2px solid #e5e7eb',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TrendingUp size={24} />
              📈 Story Creation Timeline
            </h3>

            <div style={{ 
              background: 'white',
              padding: '2rem',
              borderRadius: '12px',
              minHeight: '300px'
            }}>
              {(() => {
                const dateCounts = {};
                storyHistory.forEach(s => {
                  const date = s.timestamp.split(',')[0];
                  dateCounts[date] = (dateCounts[date] || 0) + 1;
                });

                const sortedDates = Object.entries(dateCounts)
                  .sort((a, b) => new Date(a[0]) - new Date(b[0]))
                  .slice(-10);

                if (sortedDates.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                      <TrendingUp size={48} color="#9ca3af" style={{ margin: '0 auto 1rem' }} />
                      <p>No timeline data available yet</p>
                    </div>
                  );
                }

                const maxCount = Math.max(...sortedDates.map(d => d[1]), 1);
                const chartWidth = 900;
                const chartHeight = 250;
                const padding = 50;
                const pointSpacing = sortedDates.length > 1 
                  ? (chartWidth - 2 * padding) / (sortedDates.length - 1) 
                  : 0;

                return (
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`} style={{ width: '100%', height: 'auto' }}>
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                      <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#764ba2" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    {[0, 1, 2, 3, 4].map(i => {
                      const y = chartHeight - padding - (i * (chartHeight - 2 * padding) / 4);
                      const value = Math.round((maxCount * i) / 4);
                      return (
                        <g key={i}>
                          <line
                            x1={padding}
                            y1={y}
                            x2={chartWidth - padding}
                            y2={y}
                            stroke="#e5e7eb"
                            strokeWidth="1"
                            strokeDasharray={i === 0 ? "0" : "5,5"}
                          />
                          <text
                            x={padding - 15}
                            y={y + 5}
                            textAnchor="end"
                            fontSize="12"
                            fontWeight="600"
                            fill="#6b7280"
                          >
                            {value}
                          </text>
                        </g>
                      );
                    })}

                    {/* Area under line */}
                    <path
                      d={
                        sortedDates.map((date, i) => {
                          const x = padding + i * pointSpacing;
                          const y = chartHeight - padding - ((date[1] / maxCount) * (chartHeight - 2 * padding));
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        }).join(' ') +
                        ` L ${padding + (sortedDates.length - 1) * pointSpacing} ${chartHeight - padding}` +
                        ` L ${padding} ${chartHeight - padding} Z`
                      }
                      fill="url(#areaGradient)"
                    />

                    {/* Main line */}
                    <path
                      d={sortedDates.map((date, i) => {
                        const x = padding + i * pointSpacing;
                        const y = chartHeight - padding - ((date[1] / maxCount) * (chartHeight - 2 * padding));
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Data points */}
                    {sortedDates.map((date, i) => {
                      const x = padding + i * pointSpacing;
                      const y = chartHeight - padding - ((date[1] / maxCount) * (chartHeight - 2 * padding));
                      return (
                        <g key={i}>
                          {/* Outer circle */}
                          <circle
                            cx={x}
                            cy={y}
                            r="8"
                            fill="white"
                            stroke="#667eea"
                            strokeWidth="3"
                          />
                          {/* Inner dot */}
                          <circle
                            cx={x}
                            cy={y}
                            r="4"
                            fill="#667eea"
                          />
                          {/* Date label */}
                          <text
                            x={x}
                            y={chartHeight - padding + 25}
                            textAnchor="middle"
                            fontSize="11"
                            fill="#374151"
                            fontWeight="600"
                          >
                            {date[0].split('/').slice(0, 2).join('/')}
                          </text>
                          {/* Value label above point */}
                          <text
                            x={x}
                            y={y - 18}
                            textAnchor="middle"
                            fontSize="16"
                            fontWeight="800"
                            fill="#667eea"
                          >
                            {date[1]}
                          </text>
                        </g>
                      );
                    })}

                    {/* Y-axis label */}
                    <text
                      x={15}
                      y={chartHeight / 2}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#6b7280"
                      transform={`rotate(-90, 15, ${chartHeight / 2})`}
                    >
                      Number of Stories
                    </text>

                    {/* X-axis label */}
                    <text
                      x={chartWidth / 2}
                      y={chartHeight + 50}
                      textAnchor="middle"
                      fontSize="12"
                      fontWeight="700"
                      fill="#6b7280"
                    >
                      Date
                    </text>
                  </svg>
                );
              })()}
            </div>
          </div>
          <div style={{
            background: '#f9fafb',
            padding: '2rem',
            borderRadius: '16px'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#374151',
              marginBottom: '1.5rem'
            }}>
              📈 Additional Statistics
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Most Popular Genre
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151' }}>
                  {(() => {
                    const topGenre = sortedGenres[0];
                    return topGenre && topGenre.count > 0 ? `${topGenre.name} (${topGenre.count})` : 'N/A';
                  })()}
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Total Words Written
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151' }}>
                  {totalWords.toLocaleString()} words
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Latest Story
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151' }}>
                  {storyHistory[0]?.timestamp ? storyHistory[0].timestamp.split(',')[0] : 'N/A'}
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <div style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  Media Completion
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#374151' }}>
                  {totalStories > 0 ? Math.round(((storiesWithImages + storiesWithAudio) / (totalStories * 2)) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}