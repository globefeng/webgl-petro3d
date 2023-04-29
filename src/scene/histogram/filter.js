import React, { useState, useContext } from 'react';
import {Slider, withStyles, Typography } from '@material-ui/core';
import { PetroContext } from '../../context/petroContext';

const FilterSlider = withStyles({
  root: {
    color: '#3880ff',
    height: 2,
    padding: '15px 0'
  },
  track: {
    height: 2,
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: '#bfbfbf',
  },
  mark: {
    backgroundColor: '#bfbfbf',
    height: 9,
    width: 1,
    marginTop: -4,
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
  }
})(Slider);

const magnititudeMarks = [
  {
    value: -5,
    label: '-5',
  },
  {
    value: -4,
    label: '-4',
  },
  {
    value: -3,
    label: '-3',
  },
  {
    value: -2,
    label: '-2',
  },
  {
    value: -1,
    label: '-1',
  },
  {
    value: 0,
    label: '0',
  }
];

const confidenceMarks = [
  {
    value: 0,
    label: '0',
  },
  {
    value: 1,
    label: '1',
  },
  {
    value: 2,
    label: '2',
  },
  {
    value: 3,
    label: '3',
  },
  {
    value: 4,
    label: '4',
  },
  {
    value: 5,
    label: '5',
  }
];

const FilterComponent = () => {
  const { dispatchAction } = useContext(PetroContext)
  const [magnitudeValue, setMagnitudeValue] = useState([-5, 0]);
  const [confidenceValue, setConfidenceValue] = useState([0, 5]);

  const handleMagnitudeChange = (event, newValue) => {
    setMagnitudeValue(newValue);
    dispatchAction({type:'SET_MAGNITUDE_DATA', data: newValue})
  }

  const handleConfidenceChange = (event, newValue) => {
    setConfidenceValue(newValue);
    dispatchAction({type:'SET_CONFIDENCE_DATA', data: newValue})
  }

  return (
    <div style={{width:'100%', background:"#FFFFFF", padding:'0px 0px'}}>
      <div style={{width: '80%', margin:'auto', marginTop:'15px', textAlign:'center'}}>
        <Typography>
          Magnitude
        </Typography>
        <FilterSlider value={magnitudeValue} onChange={handleMagnitudeChange} valueLabelDisplay="auto" 
        aria-labelledby="range-slider" step={1} marks={magnititudeMarks} min={-5} max={0} />
      </div>

      <div style={{width: '80%', margin:'auto', marginTop:'5px', textAlign:'center'}}>
        <Typography>
          Confidence
        </Typography>
        <FilterSlider value={confidenceValue} onChange={handleConfidenceChange} valueLabelDisplay="auto" 
        aria-labelledby="range-slider" step={1} marks={confidenceMarks} min={0} max={5} />

      </div>
    </div>
  );
}

export default FilterComponent;