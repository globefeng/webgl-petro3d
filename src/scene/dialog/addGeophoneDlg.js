import React, { useState, useContext } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, TextField } from '@material-ui/core';
import { PetroContext } from '../../context/petroContext';
import { projectService } from '../../services/projectService';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const AddGeophoneDialog = (props) => {
    const { Token } = useContext(PetroContext)
    const [unitType, setUnitType] = useState('METER');

    return (
        <Dialog open={props.open} aris-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Add Geophone</DialogTitle>
            <DialogContent>

            <Formik
                    initialValues={ {
                        geophoneData: '',
                        }
                    }
                    validationSchema={Yup.object().shape({
                        geophoneData: Yup.string().required('Geophone data is required'),
                    })}
                    onSubmit={({ geophoneData }, { setStatus, setSubmitting }) => {
                        setStatus();
                        let formData = new FormData();
                        formData.append("Data", geophoneData);
                        formData.append("UnitType", unitType);
                        projectService.addGeophone(props.projectId, props.item.id, formData, Token).then(res => {
                            window.location.reload(true);
                        },
                        error => alert('Fail to add perforation'));                        
                    }}
                    render={({ errors, status, touched, isSubmitting }) => (
                        <Form> 
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px', color:'#888888'}}>
                                <Field name="unitType"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '100%'}}>
                                            <fieldset style={{border:'#cccccc 1px solid', borderRadius:'5px'}}>
                                            <legend>Unit</legend>
                                                <label style={{marginRight:'10px'}}>
                                                    <input type="radio" name="UnitType" value="METER" checked={unitType === "METER"} onChange={() => setUnitType('METER')} />
                                                    Meter
                                                </label>
                                                <label>
                                                    <input type="radio" name="UnitType" value="FOOT" checked={unitType === "FOOT"} onChange={() => setUnitType('FOOT')} />
                                                    Foot
                                                </label>
                                            </fieldset>
                                        </div>
                                   )}
                                </Field> 
                            </div>                                                        
                                                                             
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px', width:'400px'}}>
                                <Field name="geophoneData"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '100%'}}>
                                            <TextField type="text" multiline rows="18" variant="outlined" label="MD, Stage name, Stage name, ..." fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="geophoneData" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field> 
                            </div>                            

                            <div style={{display:'flex', justifyContent: 'flex-end'}}>
                                <Button type="submit" style={{marginRight: '40px', textTransform:'none'}} size="medium" variant="contained" color="primary" >Add Geophone</Button>
                                <Button style={{marginRight: '10px', textTransform:'none'}}  size="medium" variant="contained" onClick={() => props.handleDialogClose()} >Cancel</Button>
                            </div>

                        </Form>
                    )}
                /> 

            </DialogContent>
        </Dialog>
    )
}

export default AddGeophoneDialog;
