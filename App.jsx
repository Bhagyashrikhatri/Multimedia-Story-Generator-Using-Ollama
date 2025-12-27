import React, { useState } from 'react';
import { Home, X, Clock, Trash2, ChevronLeft, Download, Image, Music, Video, Copy, Sparkles, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';
import Analytics from './Analytics';
import { genres } from './genres';

export default function MultimediaStoryWriter() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [storyPrompt, setStoryPrompt] = useState('A mysterious detective enters an abandoned mansion on a stormy night...');
  const [storyLength, setStoryLength] = useState('medium');
  const [model, setModel] = useState('llama3.2:1b');
  const [story, setStory] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [storyHistory, setStoryHistory] = useState([]);
  const [generatedImage, setGeneratedImage] = useState('');
  const [generatedAudio, setGeneratedAudio] = useState('');
  const [isGeneratingMedia, setIsGeneratingMedia] = useState({
    image: false,
    audio: false,
    video: false
  });

  React.useEffect(() => {
    const saved = localStorage.getItem('storyHistory');
    if (saved) {
      try {
        setStoryHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
  }, []);

  const lengthInstructions = {
    short: '1-2 short paragraphs',
    medium: '3-5 paragraphs',
    long: '6 or more detailed paragraphs'
  };

  const autoSaveToExcel = (newItem, fullHistory) => {
    try {
      const excelData = fullHistory.map((item, index) => {
        const genre = genres.find(g => g.id === item.genre);
        return {
          'No.': index + 1,
          'Date & Time': item.timestamp,
          'Genre': genre?.name || 'Unknown',
          'Story Prompt': item.prompt,
          'Story Content': item.story,
          'Has Image': item.image ? 'Yes' : 'No',
          'Has Audio': item.hasAudio || 'No',
          'Status': index === 0 ? '🆕 New' : '✓ Saved'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      worksheet['!cols'] = [
        { wch: 5 }, { wch: 20 }, { wch: 12 }, { wch: 40 },
        { wch: 60 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Stories');
      XLSX.writeFile(workbook, 'Story_Collection.xlsx');
      
      setStatus({ message: '✅ Story saved to Excel file!', type: 'success' });
      setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    } catch (error) {
      console.error('Error saving to Excel:', error);
    }
  };

  const saveToHistory = (storyData) => {
    const historyItem = {
      id: Date.now(),
      prompt: storyData.prompt,
      genre: storyData.genre,
      story: storyData.story,
      timestamp: new Date().toLocaleString(),
      image: storyData.image || null,
      hasAudio: generatedAudio ? 'Yes' : 'No'
    };
    const newHistory = [historyItem, ...storyHistory].slice(0, 100);
    setStoryHistory(newHistory);
    localStorage.setItem('storyHistory', JSON.stringify(newHistory));
    autoSaveToExcel(historyItem, newHistory);
  };

  const loadFromHistory = (item) => {
    setStoryPrompt(item.prompt);
    setSelectedGenre(item.genre);
    setStory(item.story);
    if (item.image) setGeneratedImage(item.image);
    setCurrentView('write');
    setSidebarOpen(false);
  };

  const deleteHistoryItem = (id) => {
    const newHistory = storyHistory.filter(item => item.id !== id);
    setStoryHistory(newHistory);
    localStorage.setItem('storyHistory', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to delete all stories?')) {
      setStoryHistory([]);
      localStorage.removeItem('storyHistory');
    }
  };

  const generateStory = async () => {
    if (!storyPrompt.trim()) {
      setStatus({ message: 'Please enter a story prompt', type: 'error' });
      return;
    }

    setIsGenerating(true);
    setStory('');
    setGeneratedImage('');
    setGeneratedAudio('');
    setStatus({ message: 'Generating story... This may take a moment.', type: 'loading' });

    const fullPrompt = `Write a ${selectedGenre} story based on this prompt: "${storyPrompt}". 

Write the story in ${lengthInstructions[storyLength]}. Make it engaging, vivid, and complete. Focus on storytelling without any meta-commentary.`;

    try {
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model, prompt: fullPrompt, stream: true })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let generatedStory = '';

      setStatus({ message: 'Story is being written...', type: 'loading' });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              generatedStory += json.response;
              setStory(generatedStory);
            }
          } catch (e) {
            console.error('Error parsing JSON:', e);
          }
        }
      }

      setStatus({ message: 'Story generated successfully!', type: 'success' });
      saveToHistory({ prompt: storyPrompt, genre: selectedGenre, story: generatedStory });

    } catch (error) {
      console.error('Error:', error);
      setStatus({ 
        message: `Error: ${error.message}. Make sure Ollama is running on localhost:11434`, 
        type: 'error' 
      });
      setStory(`Error generating story. Please check:\n\n1. Ollama is installed and running\n2. The model is downloaded (run: ollama pull ${model})\n3. Ollama is accessible at http://localhost:11434\n4. You have enough RAM (try llama3.2:1b for lower memory usage)`);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateImage = async () => {
    if (!story) {
      setStatus({ message: 'Generate a story first!', type: 'error' });
      return;
    }

    setIsGeneratingMedia({ ...isGeneratingMedia, image: true });
    setStatus({ message: 'Creating visual illustration...', type: 'loading' });

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 768;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      const genreColors = {
        mystery: ['#0f172a', '#1e293b', '#334155'],
        fantasy: ['#581c87', '#7e22ce', '#9333ea'],
        scifi: ['#0c4a6e', '#0369a1', '#0284c7'],
        horror: ['#450a0a', '#7f1d1d', '#991b1b'],
        romance: ['#881337', '#be123c', '#e11d48'],
        adventure: ['#c2410c', '#ea580c', '#f97316'],
        thriller: ['#1e293b', '#334155', '#475569']
      };
      
      const colors = genreColors[selectedGenre] || genreColors.mystery;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.5, colors[1]);
      gradient.addColorStop(1, colors[2]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.globalAlpha = 0.4;
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.6})`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      
      ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 3;
      ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
      
      ctx.fillStyle = 'white';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      ctx.shadowBlur = 15;
      ctx.font = 'bold 32px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ Story Illustration ✨', canvas.width / 2, 80);
      
      ctx.font = '18px Georgia, serif';
      const maxWidth = canvas.width - 100;
      const excerpt = story.substring(0, 200) + '...';
      const words = excerpt.split(' ');
      let line = '';
      let y = canvas.height / 2 - 30;
      
      for (let word of words) {
        const testLine = line + word + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line.length > 0) {
          ctx.fillText(line, canvas.width / 2, y);
          line = word + ' ';
          y += 28;
          if (y > canvas.height - 120) break;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width / 2, y);
      
      const genre = genres.find(g => g.id === selectedGenre);
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      const badge = `✦ ${genre?.name.toUpperCase() || 'STORY'} ✦`;
      ctx.fillText(badge, canvas.width / 2, canvas.height - 50);
      
      const imageData = canvas.toDataURL();
      setGeneratedImage(imageData);
      
      if (storyHistory.length > 0) {
        const updatedHistory = [...storyHistory];
        updatedHistory[0].image = imageData;
        setStoryHistory(updatedHistory);
        localStorage.setItem('storyHistory', JSON.stringify(updatedHistory));
        autoSaveToExcel(updatedHistory[0], updatedHistory);
      }
      
      setStatus({ message: 'Artistic illustration created!', type: 'success' });
    } catch (error) {
      console.error('Image generation error:', error);
      setStatus({ message: `Error: ${error.message}`, type: 'error' });
    } finally {
      setIsGeneratingMedia({ ...isGeneratingMedia, image: false });
    }
  };

  const generateAudio = async () => {
    if (!story) {
      setStatus({ message: 'Generate a story first!', type: 'error' });
      return;
    }

    setIsGeneratingMedia({ ...isGeneratingMedia, audio: true });
    setStatus({ message: 'Generating narration...', type: 'loading' });

    setTimeout(() => {
      setGeneratedAudio('ready');
      
      if (storyHistory.length > 0) {
        const updatedHistory = [...storyHistory];
        updatedHistory[0].hasAudio = 'Yes';
        setStoryHistory(updatedHistory);
        localStorage.setItem('storyHistory', JSON.stringify(updatedHistory));
        autoSaveToExcel(updatedHistory[0], updatedHistory);
      }
      
      setStatus({ message: 'Audio ready! Click play to hear narration.', type: 'success' });
      setIsGeneratingMedia({ ...isGeneratingMedia, audio: false });
    }, 1000);
  };

  const playAudio = () => {
    if (story) {
      const utterance = new SpeechSynthesisUtterance(story);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopAudio = () => {
    window.speechSynthesis.cancel();
  };

  const generateVideo = async () => {
    setIsGeneratingMedia({ ...isGeneratingMedia, video: true });
    setStatus({ message: 'Video generation guide logged to console', type: 'loading' });
    
    console.log(`
    === Video Generation Guide ===
    To generate videos from your story:
    1. Install Stable Diffusion WebUI
    2. Use AnimateDiff or Deforum
    3. Command: python scripts/txt2vid.py --prompt "${storyPrompt}"
    `);

    setTimeout(() => {
      setStatus({ message: 'See console for video generation guide', type: 'success' });
      setIsGeneratingMedia({ ...isGeneratingMedia, video: false });
    }, 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(story).then(() => {
      setStatus({ message: 'Story copied to clipboard!', type: 'success' });
      setTimeout(() => setStatus({ message: '', type: '' }), 2000);
    });
  };

  const downloadStory = () => {
    const blob = new Blob([story], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `story-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = () => {
    if (generatedImage) {
      const a = document.createElement('a');
      a.href = generatedImage;
      a.download = `story-illustration-${Date.now()}.png`;
      a.click();
    }
  };

  const GenreCard = ({ genre }) => {
    const Icon = genre.icon;
    return (
      <div
        onClick={() => {
          setSelectedGenre(genre.id);
          setCurrentView('write');
          setStoryPrompt('');
          setStory('');
        }}
        style={{
          background: 'white',
          borderRadius: '12px',
          padding: '1.25rem',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          border: `2px solid ${genre.color}40`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.75rem',
          minHeight: '140px',
          justifyContent: 'center'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = `0 8px 20px ${genre.color}40`;
          e.currentTarget.style.borderColor = genre.color;
          e.currentTarget.style.background = `linear-gradient(135deg, white, ${genre.color}08)`;
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = `${genre.color}40`;
          e.currentTarget.style.background = 'white';
        }}
      >
        <div style={{
          width: '65px',
          height: '65px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${genre.color}, ${genre.color}dd)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 6px 15px ${genre.color}40`
        }}>
          <Icon size={32} color="white" strokeWidth={2.5} />
        </div>
        
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '700',
          color: genre.color,
          margin: 0
        }}>
          {genre.name}
        </h3>
      </div>
    );
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '320px' : '0',
        background: 'white',
        boxShadow: '2px 0 12px rgba(0,0,0,0.1)',
        transition: 'all 0.3s',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '2px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#667eea',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Clock size={24} />
            Story History
          </h2>
          <button
            onClick={() => setSidebarOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem'
        }}>
          {storyHistory.length === 0 ? (
            <p style={{ color: '#6b7280', textAlign: 'center', padding: '2rem 1rem' }}>
              No stories yet. Start creating!
            </p>
          ) : (
            <>
              <button
                onClick={clearHistory}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                <Trash2 size={16} />
                Clear All
              </button>
              
              {storyHistory.map(item => {
                const genre = genres.find(g => g.id === item.genre);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: '#f9fafb',
                      borderRadius: '12px',
                      padding: '0.75rem',
                      marginBottom: '0.5rem',
                      cursor: 'pointer',
                      border: '2px solid #e5e7eb',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.borderColor = genre?.color || '#667eea';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.borderColor = '#e5e7eb';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    onClick={() => loadFromHistory(item)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.7rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          {item.timestamp}
                        </div>
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          color: genre?.color || '#667eea',
                          marginBottom: '0.25rem'
                        }}>
                          {genre?.name.toUpperCase() || 'STORY'}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: '#212529',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}>
                          {item.prompt}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          flexShrink: 0
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <header style={{
          background: 'white',
          padding: '0.75rem 1.5rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#667eea',
              fontSize: '1.5rem',
              fontWeight: '700',
              padding: '0.25rem 0.5rem'
            }}
            title="Toggle History"
          >
            ≡
          </button>
          
          <button
            onClick={() => {
              setCurrentView('home');
              setSelectedGenre(null);
              setSidebarOpen(false);
            }}
            style={{
              background: currentView === 'home' ? '#667eea' : 'transparent',
              color: currentView === 'home' ? 'white' : '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <Home size={20} />
            Home
          </button>

          <button
            onClick={() => {
              setCurrentView('analytics');
              setSidebarOpen(false);
            }}
            style={{
              background: currentView === 'analytics' ? '#8b5cf6' : 'transparent',
              color: currentView === 'analytics' ? 'white' : '#8b5cf6',
              border: '2px solid #8b5cf6',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.3s'
            }}
          >
            <BarChart3 size={20} />
            Analytics
          </button>

          {genres.map(genre => (
            <button
              key={genre.id}
              onClick={() => {
                setCurrentView(genre.id);
                setSelectedGenre(genre.id);
                setSidebarOpen(false);
              }}
              style={{
                background: currentView === genre.id ? genre.color : 'transparent',
                color: currentView === genre.id ? 'white' : genre.color,
                border: `2px solid ${genre.color}`,
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s'
              }}
            >
              {genre.name}
            </button>
          ))}
        </header>

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          background: 'rgba(255,255,255,0.1)'
        }}>
          {currentView === 'analytics' ? (
            <Analytics storyHistory={storyHistory} setCurrentView={setCurrentView} />
          ) : currentView === 'home' ? (
            <div>
              <h1 style={{
                fontSize: '2.25rem',
                fontWeight: '800',
                color: 'white',
                textAlign: 'center',
                marginBottom: '0.75rem',
                textShadow: '0 4px 12px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem'
              }}>
                <Sparkles size={36} />
                Multimedia Story Creator
              </h1>
              <p style={{
                fontSize: '1.125rem',
                color: 'white',
                textAlign: 'center',
                marginBottom: '2rem',
                opacity: 0.95
              }}>
                Generate stories with AI-powered images, audio, and video - Choose your genre!
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '1.25rem',
                maxWidth: '1200px',
                margin: '0 auto'
              }}>
                {genres.slice(0, 4).map(genre => (
                  <GenreCard key={genre.id} genre={genre} />
                ))}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '1.25rem',
                maxWidth: '900px',
                margin: '1.25rem auto 0'
              }}>
                {genres.slice(4).map(genre => (
                  <GenreCard key={genre.id} genre={genre} />
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              background: 'white',
              borderRadius: '20px',
              padding: '2.5rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}>
              <button
                onClick={() => setCurrentView('home')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.5rem',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}
              >
                <ChevronLeft size={20} />
                Back to Home
              </button>

              <h2 style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: genres.find(g => g.id === selectedGenre)?.color || '#667eea',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                {React.createElement(genres.find(g => g.id === selectedGenre)?.icon || BookOpen, { size: 32 })}
                {genres.find(g => g.id === selectedGenre)?.name || 'Story'} Story Creator
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
                gap: '2rem'
              }}>
                {/* Input Section */}
                <div>
                  <div style={{
                    background: '#fff3cd',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem',
                    border: '2px solid #ffc107'
                  }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '600',
                      color: '#856404',
                      marginBottom: '0.5rem'
                    }}>
                      AI Model:
                    </label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #ced4da',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="llama3.2:1b">Llama 3.2 1B (Fastest)</option>
                      <option value="llama3.2:3b">Llama 3.2 3B (Better)</option>
                      <option value="llama3.2:7b">Llama 3.2 7B (Best)</option>
                      <option value="mistral">Mistral 7B</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Story Prompt:
                    </label>
                    <textarea
                      value={storyPrompt}
                      onChange={(e) => setStoryPrompt(e.target.value)}
                      placeholder="Enter your story idea..."
                      style={{
                        width: '100%',
                        padding: '1rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        minHeight: '120px',
                        fontSize: '1rem',
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit'
                      }}
                      onFocus={(e) => e.target.style.borderColor = genres.find(g => g.id === selectedGenre)?.color || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                      display: 'block',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '0.5rem'
                    }}>
                      Story Length:
                    </label>
                    <select
                      value={storyLength}
                      onChange={(e) => setStoryLength(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        background: 'white',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = genres.find(g => g.id === selectedGenre)?.color || '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    >
                      <option value="short">Short (1-2 paragraphs)</option>
                      <option value="medium">Medium (3-5 paragraphs)</option>
                      <option value="long">Long (6+ paragraphs)</option>
                    </select>
                  </div>

                  <button
                    onClick={generateStory}
                    disabled={isGenerating}
                    style={{
                      width: '100%',
                      background: isGenerating ? '#adb5bd' : `linear-gradient(135deg, ${genres.find(g => g.id === selectedGenre)?.color || '#667eea'}, ${genres.find(g => g.id === selectedGenre)?.color || '#764ba2'}dd)`,
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      fontSize: '1.125rem',
                      fontWeight: '700',
                      cursor: isGenerating ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: isGenerating ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
                      marginBottom: '1.5rem'
                    }}
                  >
                    {isGenerating ? '✨ Generating Story...' : '🚀 Generate Story'}
                  </button>

                  <div style={{
                    background: 'linear-gradient(to bottom, #f8f9fa, #ffffff)',
                    padding: '1.5rem',
                    borderRadius: '16px',
                    border: '3px solid #e9ecef'
                  }}>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      color: genres.find(g => g.id === selectedGenre)?.color || '#667eea',
                      marginBottom: '1rem'
                    }}>
                      🎨 Media Generation
                    </h3>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '0.75rem'
                    }}>
                      <button
                        onClick={generateImage}
                        disabled={!story || isGeneratingMedia.image}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '1rem',
                          background: (!story || isGeneratingMedia.image) ? '#adb5bd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: 'white',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: (!story || isGeneratingMedia.image) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Image size={28} />
                        <span>Image</span>
                      </button>

                      <button
                        onClick={generateAudio}
                        disabled={!story || isGeneratingMedia.audio}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '1rem',
                          background: (!story || isGeneratingMedia.audio) ? '#adb5bd' : 'linear-gradient(135deg, #10b981, #059669)',
                          color: 'white',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: (!story || isGeneratingMedia.audio) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Music size={28} />
                        <span>Audio</span>
                      </button>

                      <button
                        onClick={generateVideo}
                        disabled={!story || isGeneratingMedia.video}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '1rem',
                          background: (!story || isGeneratingMedia.video) ? '#adb5bd' : 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: 'white',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: (!story || isGeneratingMedia.video) ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
                          fontWeight: '600',
                          fontSize: '0.875rem'
                        }}
                      >
                        <Video size={28} />
                        <span>Video</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Output Section */}
                <div>
                  {status.message && (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      marginBottom: '1.5rem',
                      textAlign: 'center',
                      fontWeight: '600',
                      border: '2px solid',
                      background: status.type === 'success' ? '#d1fae5' : status.type === 'error' ? '#fee2e2' : '#dbeafe',
                      color: status.type === 'success' ? '#065f46' : status.type === 'error' ? '#991b1b' : '#1e40af',
                      borderColor: status.type === 'success' ? '#10b981' : status.type === 'error' ? '#ef4444' : '#3b82f6'
                    }}>
                      {status.message}
                    </div>
                  )}

                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    minHeight: '300px',
                    maxHeight: '450px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.8',
                    color: '#212529',
                    border: '2px solid #dee2e6',
                    marginBottom: '1rem',
                    fontSize: '1rem',
                    fontFamily: 'Georgia, serif'
                  }}>
                    {story || '✨ Your generated story will appear here...'}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <button
                      onClick={copyToClipboard}
                      disabled={!story}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: !story ? '#adb5bd' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        padding: '0.875rem',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: !story ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      <Copy size={18} />
                      Copy
                    </button>
                    <button
                      onClick={downloadStory}
                      disabled={!story}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        background: !story ? '#adb5bd' : 'linear-gradient(135deg, #667eea, #764ba2)',
                        color: 'white',
                        padding: '0.875rem',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: '600',
                        cursor: !story ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s'
                      }}
                    >
                      <Download size={18} />
                      Download
                    </button>
                  </div>

                  {generatedImage && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{
                        fontWeight: '700',
                        color: '#495057',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '1.125rem'
                      }}>
                        <Image size={22} />
                        Story Illustration
                      </h3>
                      <img 
                        src={generatedImage} 
                        alt="Story illustration" 
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          border: '3px solid #dee2e6',
                          marginBottom: '1rem',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                      />
                      <button
                        onClick={downloadImage}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          color: 'white',
                          padding: '0.875rem',
                          borderRadius: '10px',
                          border: 'none',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.3s'
                        }}
                      >
                        <Download size={18} />
                        Download Image
                      </button>
                    </div>
                  )}

                  {generatedAudio && (
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h3 style={{
                        fontWeight: '700',
                        color: '#495057',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '1.125rem'
                      }}>
                        <Music size={22} />
                        Story Narration
                      </h3>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={playAudio}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: 'white',
                            padding: '0.875rem',
                            borderRadius: '10px',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        >
                          ▶ Play Audio
                        </button>
                        <button
                          onClick={stopAudio}
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                            color: 'white',
                            padding: '0.875rem',
                            borderRadius: '10px',
                            border: 'none',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        >
                          ⏹ Stop
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}