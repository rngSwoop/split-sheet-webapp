"use client";

import React, { useEffect, useState } from 'react';
import GlassButton from '@/components/ui/GlassButton';

export default function LabelDashboardPage() {
	const [artists, setArtists] = useState<Array<any>>([]);
	const [showAdd, setShowAdd] = useState(false);
	const [query, setQuery] = useState('');
	const [searchResults, setSearchResults] = useState<Array<any>>([]);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch('/api/labels/my-artists');
				if (!res.ok) return;
				const data = await res.json();
				setArtists(data.artists || []);
			} catch (err) {
				console.error(err);
			}
		})();
	}, []);

	async function search() {
		try {
			const res = await fetch(`/api/labels/search-artists?q=${encodeURIComponent(query)}`);
			if (!res.ok) return;
			const data = await res.json();
			setSearchResults(data.artists || []);
		} catch (err) {
			console.error(err);
		}
	}

	async function assign(userId: string) {
		try {
			const res = await fetch('/api/labels/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) });
			if (!res.ok) throw new Error('Assign failed');
			const r2 = await fetch('/api/labels/my-artists');
			const data = await r2.json();
			setArtists(data.artists || []);
			setSearchResults(searchResults.filter((s) => s.userId !== userId));
			alert('Assigned');
		} catch (err) {
			console.error(err);
			alert('Assign failed');
		}
	}

	return (
		<>
			{/* Dashboard Header */}
			<header className="glass-card p-6 mb-8 max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold gradient-text">Label Dashboard</h1>
			</header>

			{/* Dashboard Content */}
			<div className="glass-card p-8 max-w-4xl mx-auto">
				<p className="mb-4">View your roster and their split sheets.</p>
			<div className="mb-4 flex gap-2">
				<GlassButton onClick={() => setShowAdd(true)}>Add Artist</GlassButton>
			</div>
			{showAdd && (
				<div className="p-4 bg-[var(--color-glass-dark)] rounded-md">
					<label className="block mb-2">Search artist by name</label>
					<div className="flex gap-2">
						<input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 p-2 rounded-lg bg-black/30" />
						<GlassButton onClick={search}>Search</GlassButton>
						<GlassButton variant="outline" onClick={() => setShowAdd(false)}>Close</GlassButton>
					</div>
					<div className="mt-3 space-y-2">
						{searchResults.map((r) => (
							<div key={r.userId} className="flex items-center justify-between p-2 bg-black/20 rounded">
								<div>
									<div className="font-medium">{r.name || r.email}</div>
									<div className="text-xs text-gray-400">{r.email}</div>
								</div>
								<div>
									<GlassButton onClick={() => assign(r.userId)}>Assign</GlassButton>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div>
				<h2 className="text-xl font-semibold mb-2">Artists on this Label</h2>
				{artists.length === 0 ? (
					<p className="text-sm text-gray-400">No artists assigned to your label yet.</p>
				) : (
					<ul className="space-y-2">
						{artists.map((a) => (
							<li key={a.userId} className="p-3 bg-[var(--color-glass-dark)] rounded-md flex justify-between">
								<div>
									<div className="font-medium">{a.name || a.email}</div>
									<div className="text-xs text-gray-400">{a.email}</div>
								</div>
								<div>
									<GlassButton onClick={() => (window.location.href = `/dashboard/artist`)}>View Splits</GlassButton>
								</div>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
		</>
	);
}
