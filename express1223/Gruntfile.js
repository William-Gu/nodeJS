module.exports = function(grunt){
	// load plugins
	[	'grunt-cafe-mocha',
		'grunt-contrib-jshint',
		'grunt-exec',
		'grunt-contrib-uglify'
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
			}
		}
	});	

	// register tasks
	grunt.registerTask('default', ['cafemocha','jshint','exec','uglify']);

};
