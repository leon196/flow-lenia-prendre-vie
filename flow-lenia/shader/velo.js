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

				${SHADER_FUNCS.HASH}

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
					vec3 seed = vec3(0);
					seed.x = texture(imageMask,pos2).r;
					seed.y = floor(t/300.);
					// gSpeed *= mix(.5, 1., step(0.5, hash13(seed)));
					vec2 v=texelFetch(veloTex,coord2,0).xy
						*vSpeed
						+texelFetch(gradientTex,coord2,0).xy
						*gSpeed;
					v/=max(length(v),0.99);
					outColor=vec4(v,0.,0.);
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