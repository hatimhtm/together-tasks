# Check if bun.lock was generated, and remove it if so
if [ -f bun.lock ]; then
    rm bun.lock
fi

# Make sure to run git clean to remove artifacts if necessary
