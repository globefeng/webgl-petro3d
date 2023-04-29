
export const appLayout = 
{
  "global": {
    "tabSetEnableTabStrip": true,
    "borderBarSize": 1
  },
  "borders": [
    {
      "type": "border",
      "location": "top",
      "height": 0,
      "children": []
    }
  ],
  "layout": {
    "type": "row",
    "id": "#1",
    "children": [
      {
        "type": "tabset",
        "enableTabStrip": true,
        "id": "#11",
        "width": 250,
        "children": [
          {
            "type": "tab",
            "enableClose": false,
            "id": "#111",
            "name": "Project",
            "component": "Project"
          },
          // {
          //   "type": "tab",
          //   "enableClose": false,
          //   "id": "#112",
          //   "name": "Output",
          //   "component": "Output"
          // }
        ]
      },
      {
        "type": "row",
        "id": "#12",
        "children": [
          {
            "type": "tabset",
            "weight": 600,
            "enableDivide": true,
            "enableTabStrip": true,
            "id": "#121",
            "children": [
              {
                "type": "tab",
                "id": "#1211",
                "enableClose": false,
                "name": "View",
                "component": "scene"
              },
              // {
              //   "type": "tab",
              //   "id": "#1212",
              //   "name": "Map",
              //   "component": "map"
              // }             
            ]
          },
          // {
          //   "type": "tabset",
          //   "id": "#122",
          //   "weight": 300,
          //   "children": [
          //     {
          //       "type": "tab",
          //       "enableClose": false,
          //       "id": "#1221",
          //       "name": "Histogram",
          //       "component": "histogram"
          //     },
          //     {
          //       "type": "tab",
          //       "enableClose": false,
          //       "id": "#1222",
          //       "name": "Filter",
          //       "component": "filter"
          //     }
          //   ]
          // }
        ]
      }
    ]
  }
}
