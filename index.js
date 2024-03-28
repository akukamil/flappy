var M_WIDTH=450, M_HEIGHT=800;
var app ={stage:{},renderer:{}}, game_res,game,objects={}, LANG = 0,some_process={};

irnd = function(min,max) {	
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

anim2 = {
		
	c1: 1.70158,
	c2: 1.70158 * 1.525,
	c3: 1.70158 + 1,
	c4: (2 * Math.PI) / 3,
	c5: (2 * Math.PI) / 4.5,
	empty_spr : {x:0, visible:false, ready:true, alpha:0},
		
	slot: Array(30).fill(null),
		
	
	any_on() {		
		for (let s of this.slot)
			if (s !== null&&s.block)
				return true
		return false;			
	},
	
	linear(x) {
		return x
	},
	
	kill_anim(obj) {
		
		for (var i=0;i<this.slot.length;i++)
			if (this.slot[i]!==null)
				if (this.slot[i].obj===obj){
					this.slot[i].p_resolve('finished');		
					this.slot[i].obj.ready=true;					
					this.slot[i]=null;	
				}
	
	},
	
	flick(x){
		
		return Math.abs(Math.sin(x*6.5*3.141593));
		
	},
	
	easeBridge(x){
		
		if(x<0.1)
			return x*10;
		if(x>0.9)
			return (1-x)*10;
		return 1		
	},
	
	ease3peaks(x){

		if (x < 0.16666) {
			return x / 0.16666;
		} else if (x < 0.33326) {
			return 1-(x - 0.16666) / 0.16666;
		} else if (x < 0.49986) {
			return (x - 0.3326) / 0.16666;
		} else if (x < 0.66646) {
			return 1-(x - 0.49986) / 0.16666;
		} else if (x < 0.83306) {
			return (x - 0.6649) / 0.16666;
		} else if (x >= 0.83306) {
			return 1-(x - 0.83306) / 0.16666;
		}		
	},
	
	easeOutBack(x) {
		return 1 + this.c3 * Math.pow(x - 1, 3) + this.c1 * Math.pow(x - 1, 2);
	},
	
	easeOutBack2(x) {
		return -5.875*Math.pow(x, 2)+6.875*x;
	},
	
	easeOutElastic(x) {
		return x === 0
			? 0
			: x === 1
			? 1
			: Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * this.c4) + 1;
	},
	
	easeOutSine(x) {
		return Math.sin( x * Math.PI * 0.5);
	},
	
	easeOutCubic(x) {
		return 1 - Math.pow(1 - x, 3);
	},
	
	easeInBack(x) {
		return this.c3 * x * x * x - this.c1 * x * x;
	},
	
	easeInQuad(x) {
		return x * x;
	},
	
	easeOutBounce(x) {
		const n1 = 7.5625;
		const d1 = 2.75;

		if (x < 1 / d1) {
			return n1 * x * x;
		} else if (x < 2 / d1) {
			return n1 * (x -= 1.5 / d1) * x + 0.75;
		} else if (x < 2.5 / d1) {
			return n1 * (x -= 2.25 / d1) * x + 0.9375;
		} else {
			return n1 * (x -= 2.625 / d1) * x + 0.984375;
		}
	},
	
	easeInCubic(x) {
		return x * x * x;
	},
	
	ease2back(x) {
		return Math.sin(x*Math.PI);
	},
	
	easeInOutCubic(x) {
		
		return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
	},
	
	shake(x) {
		
		return Math.sin(x*2 * Math.PI);	
		
	},	
	
	add (obj, params, vis_on_end, time, func, block=true) {
				
		//если уже идет анимация данного спрайта то отменяем ее
		anim2.kill_anim(obj);

		let f=0;
		//ищем свободный слот для анимации
		for (var i = 0; i < this.slot.length; i++) {

			if (this.slot[i] === null) {
				
				obj.visible = true;
				obj.ready = false;

				//добавляем дельту к параметрам и устанавливаем начальное положение
				for (let key in params) {
					params[key][2]=params[key][1]-params[key][0];					
					obj[key]=params[key][0];
				}
				
				//для возвратных функцие конечное значение равно начальному
				if (func === 'ease2back' || func === 'shake' || func === 'ease3peaks')
					for (let key in params)
						params[key][1]=params[key][0];				
					
				this.slot[i] = {
					obj,
					block,
					params,
					vis_on_end,
					func: this[func].bind(anim2),
					speed: 0.01818 / time,
					progress: 0
				};
				f = 1;
				break;
			}
		}
		
		if (f===0) {
			console.log("Кончились слоты анимации");	
			
			
			//сразу записываем конечные параметры анимации
			for (let key in params)				
				obj[key]=params[key][1];			
			obj.visible=vis_on_end;
			obj.alpha = 1;
			obj.ready=true;
			
			
			return new Promise(function(resolve, reject){					
			  resolve();	  		  
			});	
		}
		else {
			return new Promise(function(resolve, reject){					
			  anim2.slot[i].p_resolve = resolve;	  		  
			});			
			
		}

		
		

	},	
		
	process() {
		
		for (var i = 0; i < this.slot.length; i++)
		{
			if (this.slot[i] !== null) {
				
				let s=this.slot[i];
				
				s.progress+=s.speed;		
				
				for (let key in s.params)				
					s.obj[key]=s.params[key][0]+s.params[key][2]*s.func(s.progress);		
				
				//если анимация завершилась то удаляем слот
				if (s.progress>=0.999) {
					for (let key in s.params)				
						s.obj[key]=s.params[key][1];
									
					s.obj.visible=s.vis_on_end;
					if (s.vis_on_end === false)
						s.obj.alpha = 1;
					
					s.obj.ready=true;					
					s.p_resolve('finished');
					this.slot[i] = null;
				}
			}			
		}
		
	},
	
	async wait(time) {
		
		await this.add(this.empty_spr,{x:[0, 1]}, false, time,'linear');	
		
	}
}

game={

	TUBE_SPEED:3,
	tubes_space:300,
	bird_speed_down:0,	
	bird_state:'fall',
	bird_up_speed:0,
	score:0,

	activate() {	
		
		objects.top_tube.visible=true;
		objects.bottom_tube.visible=true;
		
		this.tubes_space=300;
		this.reinit_tubes();	
		objects.bird.y=objects.bird.sy;
		objects.bird.tint=0xffffff;
		anim2.add(objects.bird,{x:[-200,objects.bird.sx]}, true, 0.25,'linear');	
		
		anim2.add(objects.score,{y:[-200,objects.score.sy]}, true, 0.25,'linear');	
		anim2.add(objects.t_score,{y:[-200,objects.t_score.sy]}, true, 0.25,'linear');	
		
		this.bird_speed_down=0;
		this.bird_state='fall';
		objects.bird.angle=0;	
				
		this.score=0;
		objects.t_score.text=this.score;	
		
		some_process.game=this.process.bind(game);
	},
		
	reinit_tubes(){
		
		objects.top_tube.x=450;
		objects.bottom_tube.x=450;		
				
		let v1=-290
		let v2=390-this.tubes_space-470;
		const top_start=Math.max(v1,v2);
		
		v1=-60
		v2=800-60-this.tubes_space-470;
		const top_end=Math.min(v1,v2);
		
		objects.top_tube.y=irnd(top_start,top_end);	
		objects.bottom_tube.y=objects.top_tube.y+470+this.tubes_space;
		
		this.tubes_space-=10;
		
	},
	
	tap(){
		
		this.bird_up_speed=-8;
		this.bird_state='jump';
		anim2.add(objects.bird,{angle:[objects.bird.angle,-15]}, true, 0.1,'linear');	
	},
	
	process(){
		
		objects.top_tube.x-=this.TUBE_SPEED;
		objects.bottom_tube.x=objects.top_tube.x;
		
		if (objects.top_tube.x<-140){
			
			this.reinit_tubes();			
			this.score++;
			objects.t_score.text=this.score;	
		}
		
				
		if (this.bird_state=='fall'){
			objects.bird.y+=this.bird_speed_down;	
				
			if (this.bird_speed_down<3) this.bird_speed_down+=0.1;

			
		}else{
			objects.bird.y+=this.bird_up_speed;
			this.bird_up_speed*=0.92;	
			
			if (this.bird_up_speed>-0.4){
				this.bird_speed_down=0.02;
				this.bird_state='fall';
				anim2.add(objects.bird,{angle:[objects.bird.angle,15]}, true, 0.1,'linear');		
			}
		}
		
		//лимит по высоте
		if (objects.bird.y<100) {
			this.bird_up_speed=0;
			objects.bird.y=100;
		}


		
		if (this.check_collision(objects.top_tube))
			this.close();
		if (this.check_collision(objects.bottom_tube))
			this.close();		
		if (objects.bird.y>740)
			this.close();

	},
	
	check_collision(tube){
		
		//проверка столкновений
		const bx=objects.bird.x;
		const by=objects.bird.y;
		const s_div_2=objects.bird.width*0.5-40;
		
		if (bx+s_div_2<tube.x) return false;
		if (bx-s_div_2>tube.x+tube.width) return false;
		if (by-s_div_2>tube.y+tube.height) return false;
		if (by+s_div_2<tube.y) return false;
		return true;
		
	},
	
	async close(){
		
		some_process.game=function(){};
		objects.bird.tint=0xff0000;
		await new Promise(resolve => {setTimeout(resolve, 1500);});
		
		
		anim2.add(objects.score,{y:[objects.score.y,-200]}, false, 0.25,'linear');	
		anim2.add(objects.t_score,{y:[objects.t_score.y,-200]}, false, 0.25,'linear');	
		
		anim2.add(objects.top_tube,{y:[objects.top_tube.y,-450]}, false, 0.25,'linear');	
		anim2.add(objects.bottom_tube,{y:[objects.bottom_tube.y,800]}, false, 0.25,'linear');	
		
		anim2.add(objects.bird,{x:[objects.bird.x,-100]}, false, 0.25,'linear');	
		
		main_menu.activate();
		
	}
	
	
}

main_menu={

	async activate() {
		
		
		//игровой титл
		anim2.add(objects.bcg,{alpha:[0,1]}, true, 0.5,'linear');			
		anim2.add(objects.header,{y:[-200,objects.header.sy]}, true, 1,'easeOutBack');	
		anim2.add(objects.play_button,{x:[600,objects.play_button.sx]}, true, 1,'easeOutBack');	


	},

	async close() {
		
		anim2.add(objects.header,{y:[objects.header.y,-100]}, false, 0.5,'easeInBack');	
		anim2.add(objects.play_button,{x:[objects.play_button.x,-200]}, false, 0.5,'easeInBack');	
	},

	async play_down () {

		if (anim2.any_on())
			return
		
		await this.close();
		game.activate();

	},


}

function resize() {
    const vpw = window.innerWidth;  // Width of the viewport
    const vph = window.innerHeight; // Height of the viewport
    let nvw; // New game width
    let nvh; // New game height

    if (vph / vpw < M_HEIGHT / M_WIDTH) {
      nvh = vph;
      nvw = (nvh * M_WIDTH) / M_HEIGHT;
    } else {
      nvw = vpw;
      nvh = (nvw * M_HEIGHT) / M_WIDTH;
    }
    app.renderer.resize(nvw, nvh);
    app.stage.scale.set(nvw / M_WIDTH, nvh / M_HEIGHT);
}

function vis_change() {

		
		
}

async function init_game_env(lang) {

	document.body.style.webkitTouchCallout = "none";
	document.body.style.webkitUserSelect = "none";
	document.body.style.khtmlUserSelect = "none";
	document.body.style.mozUserSelect = "none";
	document.body.style.msUserSelect = "none";
	document.body.style.userSelect = "none";	
	
							
	await load_resources();	


	//создаем приложение пикси и добавляем тень
	app.stage = new PIXI.Container();
	app.renderer = new PIXI.Renderer({width:M_WIDTH, height:M_HEIGHT,antialias:true});
	document.body.appendChild(app.renderer.view).style["boxShadow"] = "0 0 15px #000000";
	

	//события изменения окна
	resize();
	window.addEventListener("resize", resize);
	

	//создаем спрайты и массивы спрайтов и запускаем первую часть кода
	for (var i = 0; i < load_list.length; i++) {
        const obj_class = load_list[i].class;
        const obj_name = load_list[i].name;
		console.log('Processing: ' + obj_name)

        switch (obj_class) {
        case "sprite":
            objects[obj_name] = new PIXI.Sprite(game_res.resources[obj_name].texture);
            eval(load_list[i].code0);
            break;

        case "block":
            eval(load_list[i].code0);
            break;

        case "cont":
            eval(load_list[i].code0);
            break;

        case "array":
			var a_size=load_list[i].size;
			objects[obj_name]=[];
			for (var n=0;n<a_size;n++)
				eval(load_list[i].code0);
            break;
        }
    }
		
	//обрабатываем вторую часть кода в объектах
	for (var i = 0; i < load_list.length; i++) {
        const obj_class = load_list[i].class;
        const obj_name = load_list[i].name;
		console.log('Processing: ' + obj_name)
		
		
        switch (obj_class) {
        case "sprite":
            eval(load_list[i].code1);
            break;

        case "block":
            eval(load_list[i].code1);
            break;

        case "cont":	
			eval(load_list[i].code1);
            break;

        case "array":
			var a_size=load_list[i].size;
				for (var n=0;n<a_size;n++)
					eval(load_list[i].code1);	;
            break;
        }
    }

	
	//запускаем главный цикл
	main_loop();
	
	//это разные события
	document.addEventListener('visibilitychange', vis_change);
		
	
	//показыаем основное меню
	main_menu.activate();	

}

async function load_resources() {


	git_src=''

	
	game_res=new PIXI.Loader();
	game_res.add("m2_font", git_src+"fonts/Bahnschrift/font.fnt");
	
	
    //добавляем из листа загрузки
    for (var i = 0; i < load_list.length; i++)
        if (load_list[i].class === "sprite" || load_list[i].class === "image" )
            game_res.add(load_list[i].name, git_src+'res/RUS/'+load_list[i].name+"."+load_list[i].image_format);		

	
	
	await new Promise((resolve, reject)=> game_res.load(resolve))

	
	
	//короткое обращение к ресурсам
	gres=game_res.resources;

}


let time=performance.now();
let prv_time=time;
function main_loop() {
	
	
	time=performance.now();
	if (time-prv_time>14){
		for (let key in some_process) some_process[key]();	
		anim2.process();	
		prv_time=time;
	}
	
	//отображаем сцену
	app.renderer.render(app.stage);		
	requestAnimationFrame(main_loop);
}