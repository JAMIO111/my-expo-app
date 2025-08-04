import { View, StyleSheet } from 'react-native';

const StepPillGroup = ({ steps, currentStep }) => {
  return (
    <View style={styles.container}>
      {[...Array(steps)].map((_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === currentStep;

        return (
          <View
            key={stepNum}
            className={isActive ? 'bg-text-on-brand' : 'bg-text-on-brand-2'}
            style={[
              styles.pill,
              isActive ? styles.pillActive : styles.pillInactive,
              isActive && styles.pillActiveWidth,
            ]}></View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillActive: {
    flex: 2,
  },
  pillInactive: {
    flex: 1,
  },
  pillActiveWidth: {
    minWidth: 120,
  },
  textActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  textInactive: {
    color: '#666',
  },
});

export default StepPillGroup;
