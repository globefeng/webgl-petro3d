import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent } from '@material-ui/core';
import './changeLasDlg.css';

const ChangeLasDialog = (props) => {
    const [lasName, setLasName] = useState('');

    const onChangeChannel = () => {
        if (props.item.renderable !== null && lasName !== '') {
            props.item.renderable.changeChannel(lasName);
            props.item.name = lasName;
        }
        props.handleDialogClose()
    }

    return (
        <Dialog open={props.open} aris-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Change Las Channel</DialogTitle>
            <DialogContent>

                <div className="lasMenu">
                    {props.item && props.item.data &&
                        props.item.data.map((m, index) => {
                            return <div key={index} className={lasName === m ? "activeLasMenuItem" : "lasMenuItem"} onClick={() => setLasName(m)}>{m}</div>
                        })
                    }
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom:'10px' }}>
                    <Button style={{ marginRight: '20px', textTransform: 'none' }} size="medium" variant="contained" color="primary" onClick={onChangeChannel}>Change</Button>
                    <Button style={{ textTransform: 'none' }} size="medium" variant="contained" onClick={() => props.handleDialogClose()} >Cancel</Button>
                </div>


            </DialogContent>
        </Dialog>
    )
}

export default ChangeLasDialog;
