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
				uniform sampler2D imageMask;
				uniform vec2 size;
				uniform float t;
				uniform float gradientSpeed, velocitySpeed;
				in vec2 pos;
				out vec4 outColor;

				float gyroid(vec3 p)
				{
					return dot(sin(p),cos(p.yzx));
				}

				float fbm(vec3 p)
				{
					float r = 0.;
					float a = 1.;
					for (float i = 0.; i < 3.; ++i) {
						r += gyroid(p/a)*a;
						a /= 1.8;
					}
					return r;
				}

				void main(){
					vec2 pos2=pos*vec2(.5,.5)+.5;
					ivec2 coord2=ivec2(pos2*size);
					float vSpeed = velocitySpeed;
					float gSpeed = gradientSpeed;
					float gray = texture(imageTex, pos2).r;
					float tt = t/60.;
					// gSpeed = mix(-.5,.5,sin(gray*3.-tt)*.5+.5)*1.;
					float blend = texture(imageMask, pos2).r;
					float cycle = abs(fract(blend+tt/10.)-.5)*2.;
					// vSpeed = mix(vSpeed*.1, vSpeed*1.2, 1.-cycle);
					// gSpeed = mix(gSpeed*.1, gSpeed, cycle);
					// vSpeed = mix(0., 1., fract(gray*2.+tt));
					// vSpeed = mix(0., 1., fract(gray*2.+tt));
					// vSpeed = mix(0.0, 2., fract(pow(texture(imageTex, pos2).r, .4)*1.+t/60./10.));
					// vSpeed = mix(0., 2., smoothstep(.0,.1,abs(fract(gray*2.-tt)-.5))-.3);
					// vSpeed *= smoothstep(.5,.0,cycle-.1);
					vec2 v=texelFetch(veloTex,coord2,0).xy
						*vSpeed
						+texelFetch(gradientTex,coord2,0).xy
						*gSpeed;

					// curl
					vec2 e = vec2(.01,0);
					vec3 p = vec3(pos * 2., tt/10.);
					float x = (fbm(p+e.yxy)-fbm(p-e.yxy))/(2.*e.x);
					float y = (fbm(p+e.xyy)-fbm(p-e.xyy))/(2.*e.x);
					vec2 curl = vec2(x,-y);
					// v += curl * .005 * (1.-cycle);
					// v += curl * .02 * vSpeed;
					// v = mix(v,-v,step(0.5, cycle));
					// v += curl * .01 * mix(1.,-1.,step(0.5, cycle));

					// v += vec2(cos(tt),sin(tt)) * .01;
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
	run(gradientTex,veloTexPP,imageTex,settings,imageMask){
		this.uniforms={
			gradientTex:gradientTex.tex,
			veloTex:veloTexPP.tex,
			imageTex:imageTex.tex,
			size:veloTexPP.size,
			t:this.t,
			gradientSpeed:settings.gradientSpeed,
			velocitySpeed:settings.velocitySpeed,
			imageMask:imageMask,
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