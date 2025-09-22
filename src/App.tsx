import { useRef, useState, type ChangeEvent } from 'react';

import AppShell from '@/components/AppShell';
import MapCanvas from '@/components/Map/MapCanvas';
import SidebarPanels from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import { useAppStore } from '@/store/appStore';
import { parsePersistedState } from '@/utils/schema';

const App = () => {
  const drawMode = useAppStore((state) => state.drawMode);
  const setDrawMode = useAppStore((state) => state.setDrawMode);
  const clearSelection = useAppStore((state) => state.clearSelection);
  const loadFromPersistedState = useAppStore((state) => state.loadFromPersistedState);
  const getPersistedState = useAppStore((state) => state.getPersistedState);
  const recalculateFarmerShares = useAppStore((state) => state.recalculateFarmerShares);
  const resetState = useAppStore((state) => state.resetState);
  const showSprinklerBuffers = useAppStore((state) => state.showSprinklerBuffers);
  const toggleSprinklerBuffers = useAppStore((state) => state.toggleSprinklerBuffers);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectDrawMode = (mode: typeof drawMode) => {
    setDrawMode(mode);
    if (mode) {
      clearSelection();
      setStatus(`${mode === 'faucet' ? '給水栓' : mode === 'sprinkler' ? 'スプリンクラー' : '農地'}の作図モードです。地図をクリックしてください。`);
      setError(null);
    } else {
      setStatus(null);
    }
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parsed = parsePersistedState(json);
      loadFromPersistedState(parsed);
      setStatus(`${file.name} を読み込みました`);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('JSON の読み込みに失敗しました。形式を確認してください。');
    } finally {
      event.target.value = '';
    }
  };

  const handleExport = () => {
    try {
      const data = getPersistedState();
      const content = JSON.stringify(data, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `miyako-project-${new Date().toISOString().slice(0, 19)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setStatus('現在の状態を JSON に保存しました。');
      setError(null);
    } catch (err) {
      console.error(err);
      setError('JSON 書き出しに失敗しました。');
    }
  };

  const handleRecalculateShares = () => {
    recalculateFarmerShares();
    setStatus('給水栓の面積割合を再計算しました。');
    setError(null);
  };

  const handleReset = () => {
    const confirmed = window.confirm('すべてのデータを初期状態に戻します。よろしいですか？');
    if (!confirmed) {
      return;
    }
    resetState();
    setStatus('アプリの状態をリセットしました。');
    setError(null);
  };

  const handleToggleSprinklerBuffers = () => {
    toggleSprinklerBuffers();
    setStatus(`散水円を${showSprinklerBuffers ? '非表示' : '表示'}に切り替えました。`);
    setError(null);
  };

  return (
    <>
      <AppShell
        toolbar={
          <Toolbar
            drawMode={drawMode}
            onSelectDrawMode={handleSelectDrawMode}
            onImport={() => fileInputRef.current?.click()}
            onExport={handleExport}
            onRecalculateShares={handleRecalculateShares}
            onReset={handleReset}
            showSprinklerBuffers={showSprinklerBuffers}
            onToggleSprinklerBuffers={handleToggleSprinklerBuffers}
          />
        }
        sidebar={
          <div className="space-y-4">
            {(status || error) && (
              <div
                className={
                  'rounded border px-3 py-2 text-xs ' +
                  (error
                    ? 'border-rose-500 bg-rose-500/10 text-rose-100'
                    : 'border-emerald-500 bg-emerald-500/10 text-emerald-100')
                }
              >
                {error ?? status}
              </div>
            )}
            <SidebarPanels />
          </div>
        }
        map={<MapCanvas />}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={handleImportFile}
      />
    </>
  );
};

export default App;
