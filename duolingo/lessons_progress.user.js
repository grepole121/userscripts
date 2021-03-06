// ==UserScript==
// @name        Duolingo Course Progress
// @namespace   https://github.com/kane77/userscripts
// @include     https://www.duolingo.com/*
// @author      Martin Harvan
// @version     2.3
// @grant GM_getValue
// ==/UserScript==
function inject(f) { //Inject the script into the document
  var script;
  script = document.createElement('script');
  script.type = 'text/javascript';
  script.setAttribute('name', 'lesson_stats');
  script.textContent = '(' + f.toString() + ')(jQuery)';
  document.head.appendChild(script);
}
inject(f);
function f($) {
  function duolingoStats() {
    try {
      var language = window.duo.user.attributes.learning_language;
      var langData = window.duo.user.attributes.language_data[language];
      var totalSkills = langData.skills.models.length;
      var doneSkills = 0;
      var totalActivities = 0;
      var doneActivities = 0;
      for (var i = 0; i < langData.skills.models.length; i++) {
        var skill = langData.skills.models[i];
        totalActivities += skill.attributes.num_lessons;
        doneActivities += skill.attributes.num_lessons - skill.attributes.missing_lessons;
        if (skill.attributes.missing_lessons === 0) {
          doneSkills += 1;
        }
      }
      if (langData.bonus_skills) {
        totalSkills += langData.bonus_skills.length;
        for (var i = 0; i < langData.bonus_skills.models.length; i++) {
          var skill = langData.bonus_skills.models[i];
          totalActivities += skill.attributes.num_lessons;
          doneActivities += skill.attributes.num_lessons - skill.attributes.missing_lessons;
          if (skill.attributes.missing_lessons === 0) {
            doneSkills += 1;
          }
        }
      }
      storeDCPItems(new Date(), doneSkills, doneActivities, language);
      var lessonPercent = Math.round(doneActivities / totalActivities * 100);
      var skillPercent = Math.round(doneSkills / totalSkills * 100);
      var skillElem = createElem(doneSkills + "/" + totalSkills, skillPercent + "%", 'Skills', 'S');
      var lessonElem = createElem(doneActivities + "/" + totalActivities, lessonPercent + "%", 'Lessons', 'L');
      var stats = $('<ul class="sidebar-stats lesson-progress"></ul>');
      skillElem.appendTo(stats);
      lessonElem.appendTo(stats);
      var lessonDiff = (doneActivities - parseInt(getLSItem('lessons', language, 1)));
      if (lessonDiff > 0) {
        var timeDiff = (new Date() - new Date(getLSItem('date', language, 1)));
        var timePerLesson = timeDiff / lessonDiff;
        var estTime = (totalActivities - doneActivities) * timePerLesson;
        var finishDate = new Date(new Date().getTime() + estTime).toLocaleDateString();
        var days = Math.round(estTime / (1000 * 3600 * 24));
        if (!$('#estimate_stats').length) {

          var estText = createElem(finishDate, days + " days remaining", "Estimate", "E" );
          estText.appendTo(stats);
        }
      }
    function getCookie(cname) {
		var name = cname + "=";
		var ca = document.cookie.split(';');
		for(var i=0; i<ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1);
			if (c.indexOf(name) === 0) return c.substring(name.length,c.length);
		}
		return "";
    }

        
      var activitiesLeft = totalActivities - doneActivities;
      var goalFinishDate = new Date(getCookie("finishDateGoal")).getTime();
      var goalFinishDateLocale = new Date(goalFinishDate).toLocaleDateString();
      var daysToGoal = Math.round(goalFinishDate / (1000*3600*24))-Math.round(new Date().getTime()/(1000*3600*24));
      var lessonsEachDay = Math.round((activitiesLeft/daysToGoal)*100)/100;
      var lessonPerDay = createElem(lessonsEachDay, goalFinishDateLocale + " Goal Finish Date", 'Lessons-Per-Day', 'D');
      lessonPerDay.appendTo(stats);
      
  
      if ($('#app').hasClass('home') && !$('.lesson-progress').length) {
        $('.strengthen-skills-container').before(stats);
      }
    } catch (ex) {
      console.log(ex);
    }
  }
    var mouseOverCounter = 0;
  function createElem(normalText, altText, name, icon) {
    var elemText = $('<span id="' + name + '_text"><strong>' + normalText + '</strong> ' + name + '</span>');
    var percentage = $('<span id="' + name + '_percent"><strong>' + altText + '</strong></span>');
    percentage.hide();
    var elem = $('<li style="text-align: left; display: block; margin-top: 2px;" id="' + name + '_stats" title="' + altText + '"><span class="icon icon-words-small ' + name + '-icon">' + icon + '</span></li>');
    elem.append(elemText);
    elem.append(percentage);
    $('.' + name + '-icon').mouseover(function () {
      $('#' + name + '_text').hide();
      $('#' + name + '_percent').css('display', 'inline-block');
        if (name == "Lessons-Per-Day" && mouseOverCounter===0){
            mouseOverCounter++;
            clickWaiter();
        }
    }).mouseout(function () {
      $('#' + name + '_percent').hide();
      $('#' + name + '_text').show();
    });
    return elem;
  }
    function clickWaiter(){
        
    $('.Lessons-Per-Day-icon').click(function () {
        var goalDateUser = prompt("Please enter the date you would like to finish by","YYYY-MM-DD");
        function goalCookie(cname, cvalue) {
            var d = new Date();
            d.setTime(d.getTime() + (36500*24*60*60*1000));
            var expires = "expires="+d.toUTCString();
            document.cookie = cname + "=" + cvalue + "; " + expires;
			setTimeout(function(){
				location.reload();
			}, 250);
        }
        goalCookie("finishDateGoal", goalDateUser);
    });
    }
  $(document).ready(function () {
    duolingoStats();
  });
  $(document).ajaxComplete(function () {
    duolingoStats();
  });
  function getLSItem(name, language, id) {
    if (id) {
      return localStorage['dcp_' + language + '_' + name + '_' + id];
    } else {
      return localStorage['dcp_' + language + '_' + name];
    }
  }
  function setLSItem(name, language, id, value) {
    localStorage['dcp_' + language + '_' + name + '_' + id] = value;
  }
  function storeDCPItems(date, skills, lessons, language) {
    var lastIndex = getLSItem('last_index', language);
    if (!lastIndex) {
      lastIndex = 1;
    } else {
      if (lessons <= parseInt(getLSItem('lessons', language, lastIndex)) &&
      skills <= parseInt(getLSItem('skills', language, lastIndex))) {
        return;
      }
      lastIndex++;
    }
    setLSItem('date', language, lastIndex, date);
    setLSItem('skills', language, lastIndex, skills);
    setLSItem('lessons', language, lastIndex, lessons);
    localStorage['dcp_' + language + '_last_index'] = lastIndex;
  }
}


