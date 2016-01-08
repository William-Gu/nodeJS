module.exports = function(grunt){
	// load plugins
	[	'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec',
		'grunt-contrib-uglify',
		'grunt-contrib-less',
		'grunt-contrib-cssmin',
		'grunt-hashres'
	].forEach(function(task){
		grunt.loadNpmTasks(task);
	});

	// configure plugins
	grunt.initConfig({
		cafemocha: {
			all: { src: 'qa/tests-*.js', options: { ui: 'tdd' }, }
		},
		jshint: {
			app: ['meadowlark.js', 'public/js/**/*.js', 'lib/**/*.js'],
			qa: ['Gruntfile.js', 'public/qa/**/*.js', 'qa/**/*.js'],
		},
		exec: {
			linkchecker: { cmd: 'linkchecker --ignore-url=\'!^(https?:)\/\/localhost\b\' http://localhost:3000' }
		},
		uglify:{
			options:{
				stripBanners:true,
				banner:'/*| <%-pkg.name%>-<%-pkg.version%>.js <%- grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build:{
				src:'public/js/main.js',
				dest:'bulid/<%-pkg.name%>-<%-pkg.version%>.js.min.js'
			},
			all:{
				files:{
					'public/js/meadowlark.js':['public/js/**/*.js']
				}
			}
		},
		less:{
			development:{
				options:{
					customFunctions:{
						static:function(lessObject,name){
							return 'url("'+require('./lib/static.js').map(name.value)+'")';
						}
					}
				},
				files:{
					'public/css/main.css':'less/main.less',
					'publiccss/cart.css':'less/cart.less'
				}
			}
		},
		cssmin:{
			combine:{
				files:{
					'public/css/meadowlark.css':['public/css/**/*.css','!public/css/meadowlark*.css']
				}
			},
			minify:{
				src:'public/css/meadowlark.css',
				dest:'public/css/meadowlark.min.css'
			}
		},
		hashres:{
			options:{
				fileNameFormat:'${name}.${hash}.${ext}'
			},
			all:{
				src:['public/js/meadowlark.min.js','public/css/meadowlark.min.css'],
				dest:['views/layouts/main.handlebars']
			}
		}
	});	

	// register tasks
	grunt.registerTask('default', ['cafemocha','jshint','exec','uglify','less','cssmin','hashres']);

};
