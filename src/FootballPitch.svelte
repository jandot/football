<script>
    export let scale = 1
</script>

<style>
    rect {
        stroke: white;
        fill: rgb(199, 224, 199);
    }
    rect.goal {
        fill: white;
    }
    line {
        stroke: white;
    }
    circle {
        stroke: white;
        fill: none;
    }
    circle.spot {
        fill: white;
    }
</style>

<!-- For dimensions, see https://www.sportzcraazy.com/football-field-dimensions/ -->
<g id="pitch">
    <rect x=0 y=0 width={120*scale} height={90*scale} />
    <line x1={60*scale} y1=0 x2={60*scale} y2={90*scale} />
    <circle cx={60*scale} cy={45*scale} r={9.15*scale} />
    <circle class="spot" cx={60*scale} cy={45*scale} r={0.5*scale} />

    <circle cx={11*scale} cy={45*scale} r={9.15*scale} />
    <rect x=0 y={24.85*scale} width={16.5*scale} height={40.3*scale} />
    <rect x=0 y={35.85*scale} width={5.5*scale} height={18.3*scale} />
    <rect class="goal" x=0 y={41.35*scale} width={3} height={7.3*scale} />
    <circle class="spot" cx={11*scale} cy={45*scale} r={0.5*scale} />

    <circle cx={(120-11)*scale} cy={45*scale} r={9.15*scale} />
    <rect x={(120-16.5)*scale} y={24.85*scale} width={16.5*scale} height={40.3*scale} />
    <rect x={(120-5.5)*scale} y={35.85*scale} width={5.5*scale} height={18.3*scale} />
    <rect class="goal" x={120*scale-3} y={41.35*scale} width={3} height={7.3*scale} />
    <circle class="spot" cx={(120-11)*scale} cy={45*scale} r={0.5*scale} />
</g>