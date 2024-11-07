class VeloShader extends FragShader{
	constructor(){
		super(
			glsl`#version 300 es
				#define TAU ${TAU}
				precision highp float;
				precision highp sampler2D;
				
				uniform sampler2D gradientTex;
				uniform sampler2D veloTex;
				uniform sampler2D imageTex;
				uniform vec2 size;
				uniform float t;
				uniform float gradientSpeed, velocitySpeed;
				in vec2 pos;
				out vec4 outColor;

				void main(){
					vec2 pos2=pos*vec2(.5,.5)+.5;
					ivec2 coord2=ivec2(pos2*size);
					float vSpeed = velocitySpeed;
					float gSpeed = gradientSpeed;
					float gray = texture(imageTex, pos2).r;
					float tt = t/60./3.;
					gSpeed = mix(-.5,.5,sin(gray*3.-tt)*.5+.5)*1.;
					// vSpeed = mix(0., 1., fract(gray*2.+tt));
					// vSpeed = mix(0., 1., fract(gray*2.+tt));
					// vSpeed = mix(0.0, 2., fract(pow(texture(imageTex, pos2).r, .4)*1.+t/60./10.));
					// vSpeed = mix(0., 2., smoothstep(.0,.1,abs(fract(gray*2.-tt)-.5))-.3);
					vec2 v=texelFetch(veloTex,coord2,0).xy
						*vSpeed
						+texelFetch(gradientTex,coord2,0).xy
						*gSpeed;
					v/=max(length(v),1.);
					// v*=0.99;
					outColor=vec4(v,0.,0.);
					// if(t<20.){
					// 	outColor=vec4(.5,.5,0.,0.);
					// }
					// outColor=vec4(0.,0.,0.,0.);
				}
			`,
		);
		this.t=0;
	}
	run(gradientTex,veloTexPP,imageTex,settings){
		this.uniforms={
			gradientTex:gradientTex.tex,
			veloTex:veloTexPP.tex,
			imageTex:imageTex.tex,
			size:veloTexPP.size,
			t:this.t,
			gradientSpeed:settings.gradientSpeed,
			velocitySpeed:settings.velocitySpeed,
		};
		this.t++;
		this.attachments=[
			{
				attachment:veloTexPP.flip().tex,
				...sizeObj(veloTexPP.size)
			}
		];
		super.run();
	}
}