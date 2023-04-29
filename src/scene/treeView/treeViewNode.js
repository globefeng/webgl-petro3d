import React, { Component }  from 'react';
import rightIcon from './right.svg';
import downIcon from './down.svg';
import eventIcon from './event.svg';
import './treeView.css';

class TreeViewNodeComponent extends Component {
    constructor(props) {
        super(props);

        this.onChecked = this.onChecked.bind(this);
        this.onCollapse = this.onCollapse.bind(this);

        this.state = { levelArray: Array(props.level).fill(0),
                       checked: props.data.checked,
                       collapsed: !props.data.expanded,
                     };
    }

    onChecked() {
        // let nChecked = !this.state.checked;
        // this.setState({checked: nChecked});
        //this.props.updateNodeCheckState(11);
    }

    onCollapse() {
        // this.setState({collapsed: !this.state.collapsed});
    }

    render() {
        let collapsedIcon = this.state.collapsed ? downIcon : rightIcon;
        let checkButton = this.state.checked ? 
        <input type="checkBox" onClick={() => this.onChecked()} checked /> :
        <input type="checkBox" onClick={() => this.onChecked()} />;

        return (
            <div className="treeDiv">
                <div className="treeRow">
                {this.state.levelArray.map((a, index) => <span key={index}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>)}
                <div className="treeArrow"> 
                   { this.props.data.Children && this.props.data.Children.length > 0 &&
                        <div className="treeButton" onClick={this.onCollapse()}>
                            <img className="treeIcon" src={collapsedIcon} alt="collapsed Icon" />
                        </div>
                   }
                </div>
                {checkButton}
                <div className="treeContent" onClick={() => this.onCollapse()}>
                    <img className="treeIcon" src={eventIcon} alt="check" />
                    {this.props.data.treeType} {this.props.data.name} {this.props.data.id} 
                </div>
                { !this.state.collapsed && this.props.data.Children && 
                    <div className="treeRow">
                        {this.props.data.Children.map((a, index) => <TreeViewNodeComponent key={index} data={a} level={this.props.level + 1} />)}                        
                    </div>
                }
                </div>
            </div>
        );
    }
}


export default TreeViewNodeComponent;
