class LeniaShader extends FragShader{
	constructor(kSize=10){
		super(
			glsl`#version 300 es
				#define TAU ${TAU}
				#define PI ${PI}
				precision highp float;
				precision highp sampler2D;

				uniform sampler2D imageTex;
				uniform sampler2D imageTex2;
				uniform sampler2D leniaTex;
				uniform vec2 size;
				uniform sampler2D geneTex;
				uniform vec2 geneSize;
				uniform sampler2D dnaTex;
				uniform vec2 dnaSize;
				uniform int geneGroupLength;
				uniform float rand;
				uniform float tick;
				uniform float time;
				in vec2 pos;

				layout(location = 0) out vec4 outColor0;

				${SHADER_FUNCS.DATA_TEX}
				${SHADER_FUNCS.HASH}
				
				ivec2 loopCoord(ivec2 coord){
					return ivec2(mod(vec2(coord),size));
				}

				float growth(float dist,float amp,float freq,float phase){
					return amp*sin(TAU*(dist/freq-phase));
				}
				float[8] check(ivec2 c,sampler2D tex){
					float[8] totals;
					float[8] weights;
					float weightCombined;

					int kSize=${kSize};
					for(int x=-kSize;x<=kSize;x++){
						for(int y=-kSize;y<=kSize;y++){
							ivec2 offset=ivec2(x,y);
							float l=length(vec2(offset));
							if(l<=float(kSize)){
								float f=l/float(kSize);
								float idxF=clamp(f*f,0.,1.)*8.;
								float m=mod(idxF,1.);
								float m2=1.-m;
								int i=int(idxF);

								float w=1.;
								float v=texelFetch(tex,loopCoord(c+offset),0).r*w;
								totals[i]+=v*m2;
								weights[i]+=w*m2;
								totals[i+1]+=v*m;
								weights[i+1]+=w*m;
							}
						}
					}
					for(int i=0;i<8;i++){
						totals[i]/=weights[i];
					}
					return totals;
				}
				float[8] subtract(float[8] a,float[8] b){
					for(int i=0;i<8;i++){
						a[i]-=b[i];
					}
					return a;
				}
				float[8] multiply(float[8] a,float[8] b){
					for(int i=0;i<8;i++){
						a[i]*=b[i];
					}
					return a;
				}
				float[8] square(float[8] a){
					for(int i=0;i<8;i++){
						a[i]*=a[i];
					}
					return a;
				}
				float integral(float[8] a){
					float total=0.;
					for(int i=0;i<8;i++){
						total+=a[i];
					}
					return total/8.;
				}
				float[8] normal(float[8] a){
					float total=integral(a);
					if(total==0.){
						return a;
					}
					for(int i=0;i<8;i++){
						a[i]/=total;
					}
					return a;
				}
				float[8] normal(float[8] a,out float total){
					total=integral(a);
					if(total==0.){
						return a;
					}
					for(int i=0;i<8;i++){
						a[i]/=total;
					}
					return a;
				}
				float[8] diff(float[8] a){
					float[8] b;
					for(int i=0;i<8;i++){
						if(i>0){
							b[i]+=a[i]-a[i-1];
						}
						if(i<7){
							b[i]+=a[i+1]-a[i];
						}
					}
					return b;
				}

				float[16] subtract(float[16] a,float[16] b){
					for(int i=0;i<16;i++){
						a[i]-=b[i];
					}
					return a;
				}
				float[16] multiply(float[16] a,float[16] b){
					for(int i=0;i<16;i++){
						a[i]*=b[i];
					}
					return a;
				}
				float[16] square(float[16] a){
					for(int i=0;i<16;i++){
						a[i]*=a[i];
					}
					return a;
				}
				float integral(float[16] a){
					float total=0.;
					for(int i=0;i<16;i++){
						total+=a[i];
					}
					return total/16.;
				}
				float[16] normal(float[16] a){
					float total=integral(a);
					if(total==0.){
						return a;
					}
					for(int i=0;i<16;i++){
						a[i]/=total;
					}
					return a;
				}
				float[16] diff(float[16] a){
					float[16] b;
					for(int i=0;i<16;i++){
						if(i>0){
							b[i]+=a[i]-a[i-1];
						}
						if(i<7){
							b[i]+=a[i+1]-a[i];
						}
					}
					return b;
				}
				
				float compare(float[16] a,float[16] point,vec3 wave){
					float dist=sqrt(integral(square(subtract(a,point))));
					return growth(dist,wave[0],wave[1],wave[2]);
				}
				float compare(float[8] a,float[8] point,vec3 wave){
					float dist=sqrt(integral(square(subtract(a,point))));
					return growth(dist,wave[0],wave[1],wave[2]);
				}

				float gyroid(vec3 p)
				{
					return dot(sin(p),cos(p.yzx));
				}

				float fbm(vec3 p)
				{
					float r = 0.;
					float a = 1.;
					for (float i = 0.; i < 5.; ++i) {
						r += gyroid(p/a)*a;
						a /= 1.8;
					}
					return r;
				}

				vec4 getGenePart(int idx){
					// ivec2 geneCoord=getIdxCoord(idx,geneSize);
					// vec4 gene = texelFetch(geneTex,geneCoord,0);
					ivec2 geneCoord=getIdxCoord(idx,geneSize);
					// vec2 pos2=(pos+1.)*.5;
					vec2 pos2=(pos+1.)*.5;
					float rng = hash12(gl_FragCoord.xy);
					float m = texture(imageTex, pos2).r;
					float wave = sin(time/30. + m * 6.) * 0.5 + 0.5;
					vec4 gene = texelFetch(geneTex,geneCoord,0);
					float spread = .5+.5*sin(time/2000.);
					float f = fract(m*spread+time/1000.+.2*rng);
					// float m = texture(imageTex2, pos2+jitter*.1).r;
					// // vec4 rng = hash42(vec2(0., 36517.));
					// // float wave = sin(time/300. + m * 6.) * 0.5 + 0.5;
					// float spread = .5+.5*sin(time/2000.);
					vec2 jitter = hash42(gl_FragCoord.xy).xy-.5;
					float m2 = texture(imageTex2, pos2+jitter*.1).r;
					float f2 = fract(m+time/1000.+rng*.1+m2*.1);//+.1*hash12(gl_FragCoord.xy));
					// // gene -= 0.05 * f;//sin(f*3.1415);// * (.4+.6*rng.x);
					// // return gene;
					
					// float f = .5+.5*sin(time);
					
					// gene -= 0.05 * f;
					return gene;
				}
				float gene(int geneIdx,float[8] c){
					int idx=geneIdx*geneGroupLength;
					vec4 lookup1=getGenePart(idx+1);
					vec4 lookup2=getGenePart(idx+2);
					vec4 lookup3=getGenePart(idx+3);
					float[8] geneVals=float[](
						lookup1[0],
						lookup1[1],
						lookup1[2],
						lookup1[3],
						lookup2[0],
						lookup2[1],
						lookup2[2],
						lookup2[3]
					);
					vec3 geneVec=lookup3.xyz;
					return compare(c,geneVals,geneVec);
				}
				float screen(float a,float b){
					return 1.-(1.-a)*(1.-b);
				}
				void main(){
					vec2 pos2=(pos+1.)*.5;
					ivec2 coord2=ivec2(pos2*size);

					ivec4 dna=ivec4(texelFetch(dnaTex,coord2,0));
					// dna = (dna+ivec4(tick*100.)) % ivec4(1000);
					// dna = dna + 357;
					// dna = ivec4(6573);
					if(dna==ivec4(-1)){
						outColor0=vec4(0.,0.,0.,0.);
						return;
					}

					float[8] c=check(coord2,leniaTex);
					float mass;
					c=normal(c,mass);
					float result=screen(
						clamp(
						(gene(dna[0],c)+
						gene(dna[1],c)+
						gene(dna[2],c)+
						gene(dna[3],c))/4.,
						-1.,1.),
						min(mass/8.*0.1,1.)
					);

					// result *= .9;

					outColor0=vec4(result,0.,0.,0.);
				}
			`,
		);
	}
	run(geneGroupLength,imageTex,imageTex2,geneTex,dnaTex,leniaTex,affinityTex){
		this.uniforms={
			geneGroupLength,
			imageTex:imageTex.tex,
			imageTex2:imageTex2,
			leniaTex:leniaTex.tex,
			size:leniaTex.size,
			geneTex:geneTex.tex,
			geneSize:geneTex.size,
			dnaTex:dnaTex.tex,
			dnaSize:dnaTex.size,
			tick: Math.floor(time),
			time: elapsed,
			rand: rand(),
		};
		this.attachments=[
			{
				attachment:affinityTex.tex,
				...sizeObj(affinityTex.size)
			}
		];
		super.run();
	}
}