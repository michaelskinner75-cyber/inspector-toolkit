(function(){
'use strict';
const DATA_KEY='guideTicketsFaresV2';
const MARKER='guideTicketBoundariesOfficialV1';
if(localStorage.getItem(MARKER)==='1')return;
let data=null;
try{data=JSON.parse(localStorage.getItem(DATA_KEY)||'null');}catch(e){}
if(!data||!data.fares)return;
data.boundaries=[
 {title:'Town / City Zones',details:'Stagecoach East Scotland town and city zones are Arbroath, Dundee, Dunfermline, Edinburgh, Forfar, Glenrothes, Kirkcaldy, Leven, Perth and St Andrews. A Town Zone ticket is valid only inside the selected local zone shown on the official Stagecoach zone map.'},
 {title:'Dunfermline Town Zone',details:'Covers Dunfermline and the surrounding local area shown on the Stagecoach map, including Crossford, Rosyth and the Halbeath Park & Ride area. Saline, Cairneyhill, Inverkeithing, Ferrytoll Park & Ride and Cowdenbeath sit outside the shaded town-zone boundary.'},
 {title:'Kirkcaldy Town Zone',details:'Covers Kirkcaldy, Chapel, Dysart and Seafield within the shaded Stagecoach boundary. Thornton, Cardenden and Kinghorn sit outside the shaded town-zone boundary.'},
 {title:'Leven Town Zone',details:'Covers Leven, Kennoway, Windygates, Muiredge and Lundin Links within the shaded Stagecoach boundary. East Wemyss and areas beyond Upper Largo sit outside the shaded town-zone boundary.'},
 {title:'St Andrews Town Zone',details:'Covers St Andrews and the immediate local area shown on the Stagecoach map. Guardbridge, Craigtoun and areas beyond Kinkell Braes sit outside the shaded town-zone boundary.'},
 {title:'Regional Zones',details:'Stagecoach East Scotland regional zones are Central Fife, North East Fife, West Fife, Angus, North Perthshire & the Carse, and South Perthshire & Kinross. A Regional ticket is valid only inside the selected regional zone.'},
 {title:'Central Fife Regional Zone',details:'Covers the central and south-east Fife area shown on the Stagecoach map, including Cowdenbeath, Lochgelly, Ballingry, Cardenden, Glenrothes, Kirkcaldy, Leven, Burntisland and Aberdour. Cupar, St Andrews, Elie, Inverkeithing, Ferrytoll Park & Ride and Halbeath Park & Ride sit outside the shaded Central Fife boundary.'},
 {title:'North East Fife Regional Zone',details:'Covers North East Fife and the Tay corridor shown on the Stagecoach map, including Glenrothes, Leven, Cupar, St Andrews, the East Neuk, Newport, Tayport and Dundee. Areas west of the shaded boundary and locations beyond the marked Dundee / Monifieth edge are outside the zone.'},
 {title:'West Fife Regional Zone',details:'Covers the West Fife area shown on the official Stagecoach West Fife zone map. Check the map for the exact outer boundary where West Fife meets Central Fife, Edinburgh and the wider East Scotland network.'},
 {title:'East Scotland Zone',details:'Valid for unlimited travel on Stagecoach services across the whole East Scotland operating area. Stagecoach describes this as travel on all services across East Scotland; specific exceptions or partner services should still be checked where applicable.'},
 {title:'Route 19 Ticket Boundary',details:'Valid on Stagecoach service 19 along the route serving Ballingry, Lochgelly, Cowdenbeath, Halbeath Park & Ride, Dunfermline and Rosyth. The ticket is for travel on Route 19 rather than general travel across the wider town or regional zones.'}
];
localStorage.setItem(DATA_KEY,JSON.stringify(data));
localStorage.setItem(MARKER,'1');
})();