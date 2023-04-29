import React, { useState, useContext } from 'react';
import { PetroContext } from '../../context/petroContext';
import { Button, Dialog, DialogTitle, DialogContent, TextField } from '@material-ui/core';
import { projectService } from '../../services/projectService';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const AddWellboreDialog = (props) => {
    const { Token, workingProject } = useContext(PetroContext)
    const [dataType, setDataType] = useState('END');
    const [unitType, setUnitType] = useState('METER');

    return (
        <Dialog open={props.open} aris-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Add Wellbore</DialogTitle>
            <DialogContent>

            <Formik
                    initialValues={ {
                            wellboreName: '',
                            elevation: '',
                            longitude: '',
                            latitude: '',
                            jointPoints: '',
                            }
                    }
                    validationSchema={Yup.object().shape({
                        wellboreName: Yup.string().required('Wellbore name is required'),
                        longitude: Yup.number().required('Longitude is required').min(-180, "Minimum value is -180").max(180, "Maximum value is 180"),
                        latitude: Yup.number().required('Latitude is required').min(-90, "Minimum value is -90").max(90, "Maximum value is 90"),
                        elevation: Yup.number().required('Elevation is required'),
                        jointPoints: Yup.string().required('Joint Points are required'),
                    })}
                    onSubmit={({ wellboreName, longitude, latitude, elevation, jointPoints }, { setStatus, setSubmitting }) => {
                        setStatus();
                        let formData = new FormData();
                        formData.append("name", wellboreName);
                        formData.append("longitude", longitude);
                        formData.append("latitude", latitude);
                        formData.append("elevation", elevation);
                        formData.append("dataType", dataType);
                        formData.append("unitType", unitType);
                        formData.append("jointsData", jointPoints);
                        
                        projectService.addWellbore(workingProject, formData, Token).then(res => {
                            props.handleDialogClose(true);
                        },
                        error => alert('Fail to add wellbore'));
                    }}
                    render={({ errors, status, touched, isSubmitting }) => (
                        <Form>                          
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px'}}>
                                <Field name="wellboreName"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '48%'}}>
                                            <TextField type="text" variant="outlined" label="Name" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="wellboreName" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field>    
                                <Field name="elevation"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '48%'}}>
                                            <TextField type="text" variant="outlined" label="Head: Elevation" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="elevation" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field>                                                    
                            </div>
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px'}}>
                                <Field name="longitude"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '48%'}}>
                                            <TextField type="text" variant="outlined" label="Head: Longitude" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="longitude" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field> 
                                <Field name="latitude"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '48%'}}>
                                            <TextField type="text" variant="outlined" label="Head: Latitude" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="latitude" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field> 
                            </div> 
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px', color:'#888888'}}>
                                <Field name="dataType"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '68%'}}>
                                            <fieldset style={{border:'#cccccc 1px solid', borderRadius:'5px'}}>
                                            <legend>Data Type</legend>
                                            <div>
                                                <label style={{marginRight:'10px'}}>
                                                    <input type="radio" name="DataType" value="EAST-NORTH-DEPTH" checked={dataType === "END"} onChange={() => setDataType('END')} />
                                                    East, North, Depth
                                                </label>
                                            </div>
                                            <div>
                                                <label>
                                                    <input type="radio" name="DataType" value="MD-INC-AZI" checked={dataType === "MIA"} onChange={() => setDataType('MIA')} />
                                                    MD, Inclination, Azimuth
                                                </label>
                                            </div>
                                            </fieldset>
                                        </div>
                                   )}
                                </Field> 
                                <Field name="unitType"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '28%'}}>
                                            <fieldset style={{border:'#cccccc 1px solid', borderRadius:'5px'}}>
                                            <legend>Unit</legend>
                                            <div>
                                                <label style={{marginRight:'10px'}}>
                                                    <input type="radio" name="UnitType" value="METER" checked={unitType === "METER"} onChange={() => setUnitType('METER')} />
                                                    Meter
                                                </label>
                                            </div>
                                            <div>
                                                <label>
                                                    <input type="radio" name="UnitType" value="FOOT" checked={unitType === "FOOT"} onChange={() => setUnitType('FOOT')} />
                                                    Foot
                                                </label>
                                            </div>
                                            </fieldset>
                                        </div>
                                   )}
                                </Field> 
                            </div>                                                        
                            <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'20px'}}>
                                <Field name="jointPoints"> 
                                   {({field, form: { touched, errors }, meta,}) => (
                                        <div style={{display:'flex', flexDirection:'column', justifyContent: 'space-between', width: '100%'}}>
                                            <TextField type="text" multiline rows="12" variant="outlined" label="Joint Points" fullWidth InputLabelProps={{shrink: true}}  {...field} /> 
                                            <div><ErrorMessage name="jointPoints" component="div" style={{color:'red'}} /></div>
                                        </div>
                                   )}
                                </Field> 
                            </div>                            

                            <div style={{display:'flex', justifyContent: 'flex-end'}}>
                                <Button type="submit" style={{marginRight: '40px', textTransform: 'none'}} size="medium" variant="contained" color="primary" >Add Wellbore</Button>
                                <Button style={{marginRight: '10px', textTransform: 'none'}}  size="medium" variant="contained" onClick={() => props.handleDialogClose()} >Cancel</Button>
                            </div>

                        </Form>
                    )}
                /> 

            </DialogContent>
        </Dialog>
    )
}

export default AddWellboreDialog;
