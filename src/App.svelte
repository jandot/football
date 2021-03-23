<script>
	import FootballPitch from './FootballPitch.svelte';
	let datapoints = [];
	fetch("http://localhost:5000/assets/events_European_Championship.json")
		.then(res => res.json())
		.then(data => data.filter(d => d.matchId == 1694390))
		.then(data => data.filter(d => d.positions.length == 2))
		.then(data => data.filter(d => d.positions[0].x > 0 & d.positions[0].x < 100 &
									   d.positions[0].y > 0 & d.positions[0].y < 100 &
									   d.positions[1].x > 0 & d.positions[1].x < 100 &
									   d.positions[1].y > 0 & d.positions[1].y < 100))
		.then(data => data.filter(d => d.matchPeriod == "1H"))
		.then(data => datapoints = data)
		// .then(data => datapoints = data.slice(1,10000))
	$: console.log(datapoints)

	$: teams = [...new Set(datapoints.slice(1,100).map(d => d.teamId))]
	
	let minuteBins = new Array(50).fill(0)
	$: datapoints.forEach(d => {
		let minute = Math.floor(d.eventSec/60)
		minuteBins[minute] += 1
	})
	$: console.log(minuteBins)

	let scale = 7;
	let slider_value = 0;
</script>

<style>
	line {
		stroke: #7570b3;
		stroke-opacity: 0.1;
	}
	circle {
		fill: #7570b3;
		fill-opacity: 0.1;
	}
	line.team_1 {
		stroke: #d95f02;
	}
	circle.team_1 {
		fill: #d95f02
	}
	line.inrange {
		stroke-opacity: 0.8;
	}
	circle.inrange {
		fill-opacity: 0.8;
	}
	line.histogram {
		stroke: black;
		stroke-opacity: 0.8;
		stroke-width: 5;
	}
	line.histogram.inrange {
		stroke: red;
		stroke-opacity: 1;
	}
</style>

Minute: {Math.floor(slider_value / 60)}
<div><input type="range" min=0 max=3000 bind:value={slider_value} /></div>

<svg width=850 height=700>
	<FootballPitch scale={scale}/>
	<g>
		{#each datapoints as datapoint}
			<circle cx={datapoint.positions[0].x*1.2*scale} cy={datapoint.positions[0].y*0.9*scale} r=2
					class:inrange={Math.abs(datapoint.eventSec - slider_value) < 25}
					class:team_1={datapoint.teamId == teams[0]} />
			<line x1={datapoint.positions[0].x*1.2*scale} y1={datapoint.positions[0].y*0.9*scale}
				x2={datapoint.positions[1].x*1.2*scale} y2={datapoint.positions[1].y*0.9*scale}
				class:inrange={Math.abs(datapoint.eventSec - slider_value) < 25}
				class:team_1={datapoint.teamId == teams[0]} >
				<title>{JSON.stringify(datapoint)}</title>
			</line>
		{/each}
	</g>
	<g>
		{#each minuteBins as minuteBin, idx}
			<line x1={10+idx*6} y1="680" x2={10+idx*6} y2={680-minuteBin}
				  class="histogram"
				  class:inrange={idx == Math.floor(slider_value/60)}>
				<title>{idx}</title>
			</line>
		{/each}
	</g>
</svg>
