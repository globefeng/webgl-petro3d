export default class TreeViewItem {
    id = 0;
    depth = 0;
    name = '';
    treeType = 0;   // 0: project, 1: wellGroup, 2: Wellbore, 3: EventGroup, 4: EventWellGroup, 5: EventStage, 
                      // 6: Geophone, 7: Perf, 8: Las 
                      // 9: PlaneGroup, 10: Plane, 11: FormationGroup, 12: Formation 
    checked = true;
    expanded = true;
    hasChildren = true;
    renderable = null;
    Children = [];
    data = [];
}